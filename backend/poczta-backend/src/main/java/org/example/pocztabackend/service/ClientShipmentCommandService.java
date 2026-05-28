package org.example.pocztabackend.service;

import org.example.pocztabackend.dto.ClientShipmentRedirectRequest;
import org.example.pocztabackend.dto.ClientShipmentRedirectResponse;
import org.example.pocztabackend.dto.CreateClientShipmentRequest;
import org.example.pocztabackend.dto.PaymentRequest;
import org.example.pocztabackend.dto.PaymentResponse;
import org.example.pocztabackend.dto.ShipmentCreatedResponse;
import org.example.pocztabackend.dto.ShipmentStateChangeResponse;
import org.example.pocztabackend.model.Point;
import org.example.pocztabackend.model.Redirection;
import org.example.pocztabackend.model.Shipment;
import org.example.pocztabackend.model.TrackingEvent;
import org.example.pocztabackend.model.User;
import org.example.pocztabackend.model.enums.ShipmentStatus;
import org.example.pocztabackend.model.enums.ShipmentNodeType;
import org.example.pocztabackend.model.enums.ShipmentRouteStatus;
import org.example.pocztabackend.repository.PointRepository;
import org.example.pocztabackend.repository.RedirectionRepository;
import org.example.pocztabackend.repository.ShipmentRepository;
import org.example.pocztabackend.repository.TrackingEventRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.UUID;

@Service
public class ClientShipmentCommandService {

    private final ShipmentRepository shipmentRepository;
    private final PointRepository pointRepository;
    private final PaymentService paymentService;
    private final AuthFacadeService authFacadeService;
    private final RedirectionRepository redirectionRepository;
    private final TrackingEventRepository trackingEventRepository;
    private final ShipmentWorkflowService workflowService;
    private final ShipmentRoutingService shipmentRoutingService;

    public ClientShipmentCommandService(
            ShipmentRepository shipmentRepository,
            PointRepository pointRepository,
            PaymentService paymentService,
            AuthFacadeService authFacadeService,
            RedirectionRepository redirectionRepository,
            TrackingEventRepository trackingEventRepository,
            ShipmentWorkflowService workflowService,
            ShipmentRoutingService shipmentRoutingService
    ) {
        this.shipmentRepository = shipmentRepository;
        this.pointRepository = pointRepository;
        this.paymentService = paymentService;
        this.authFacadeService = authFacadeService;
        this.redirectionRepository = redirectionRepository;
        this.trackingEventRepository = trackingEventRepository;
        this.workflowService = workflowService;
        this.shipmentRoutingService = shipmentRoutingService;
    }

    @Transactional
    public ShipmentCreatedResponse createShipment(String userEmail, CreateClientShipmentRequest request) {
        User creator = authFacadeService.requireUser(userEmail);
        String intakeMethod = normalizeRouteOption(request.delivery().intakeMethod(), "intakeMethod");
        String deliveryMethod = normalizeRouteOption(request.delivery().deliveryMethod(), "deliveryMethod");
        validateRouteConfiguration(request, intakeMethod, deliveryMethod);

        Shipment shipment = new Shipment();
        shipment.setTrackingNumber(generateTrackingNumber());
        shipment.setStatus(ShipmentStatus.CREATED);
        shipment.setSenderName(request.sender().name());
        shipment.setSenderPhone(request.sender().phone());
        shipment.setSenderAddress(request.sender().address());
        shipment.setRecipientName(request.recipient().name());
        shipment.setRecipientPhone(request.recipient().phone());
        shipment.setRecipientAddress(request.recipient().address());
        shipment.setIntakeMethod(intakeMethod);
        shipment.setDeliveryMethod(deliveryMethod);
        shipment.setDeliveryType(resolveLegacyDeliveryType(request));
        shipment.setWeight(request.parcel().weight());
        shipment.setSizeCategory(request.parcel().sizeCategory());
        shipment.setDeclaredValue(request.parcel().declaredValue());
        shipment.setFragile(Boolean.TRUE.equals(request.parcel().fragile()));
        shipment.setCreatedAt(LocalDateTime.now());
        shipment.setEstimatedDeliveryDate(LocalDate.now().plusDays(2));
        shipment.setCreator(creator);

        if (request.delivery().sourcePointCode() != null && !request.delivery().sourcePointCode().isBlank()) {
            Point point = pointRepository.findByPointCode(request.delivery().sourcePointCode().trim().toUpperCase(Locale.ROOT))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Source point not found"));
            shipment.setSourcePoint(point);
        }

        if (request.delivery().targetPointCode() != null && !request.delivery().targetPointCode().isBlank()) {
            Point point = pointRepository.findByPointCode(request.delivery().targetPointCode().trim().toUpperCase(Locale.ROOT))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target point not found"));
            shipment.setTargetPoint(point);
        }

        shipmentRoutingService.applyRouteState(
                shipment,
                ShipmentRouteStatus.READY_FOR_HANDOVER,
                ShipmentNodeType.CLIENT,
                creator.getEmail()
        );

        Shipment savedShipment = shipmentRepository.save(shipment);

        // Base price + optional extras (same logic as frontend)
        BigDecimal paymentAmount = new java.math.BigDecimal("19.99");
        if (request.parcel().declaredValue() != null && request.parcel().declaredValue().signum() > 0) {
            paymentAmount = paymentAmount.add(new java.math.BigDecimal("5.00")); // insurance
        }
        if (Boolean.TRUE.equals(request.parcel().fragile())) {
            paymentAmount = paymentAmount.add(new java.math.BigDecimal("3.00")); // fragile surcharge
        }

        PaymentResponse payment = paymentService.createPayment(
                new PaymentRequest(
                        savedShipment.getId(),
                        paymentAmount,
                        request.payment().method().trim().toUpperCase(Locale.ROOT)
                )
        );

        return new ShipmentCreatedResponse(
                savedShipment.getTrackingNumber(),
                savedShipment.getId(),
                savedShipment.getStatus() == null ? null : savedShipment.getStatus().name(),
                payment.status() == null ? null : payment.status().name()
        );
    }

    @Transactional
    public ClientShipmentRedirectResponse requestRedirect(
            String userEmail,
            String trackingNumber,
            ClientShipmentRedirectRequest request
    ) {
        User creator = authFacadeService.requireUser(userEmail);
        Shipment shipment = shipmentRepository.findByTrackingNumberAndCreator_Id(trackingNumber, creator.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shipment not found"));

        if (!canRequestRedirect(shipment)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Client redirect is not available for shipment status " + shipment.getStatus()
            );
        }

        Point targetPoint = pointRepository.findByPointCode(request.targetPointCode().trim().toUpperCase(Locale.ROOT))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Target point not found"));

        shipment.setTargetPoint(targetPoint);
        shipmentRepository.save(shipment);

        Redirection redirection = Redirection.builder()
                .requestedAt(LocalDateTime.now())
                .reason(request.reason())
                .status("REQUESTED")
                .shipment(shipment)
                .targetPoint(targetPoint)
                .build();
        Redirection savedRedirection = redirectionRepository.save(redirection);

        TrackingEvent event = new TrackingEvent();
        event.setShipment(shipment);
        event.setStatus(shipment.getStatus() == null ? null : shipment.getStatus().name());
        event.setLocationName("Client self-service");
        event.setDescription("Client requested redirect to point " + targetPoint.getPointCode());
        event.setEventTime(LocalDateTime.now());
        trackingEventRepository.save(event);

        return new ClientShipmentRedirectResponse(
                shipment.getTrackingNumber(),
                shipment.getStatus() == null ? null : shipment.getStatus().name(),
                targetPoint.getPointCode(),
                savedRedirection.getId(),
                savedRedirection.getStatus()
        );
    }

    @Transactional
    public ShipmentStateChangeResponse cancelShipment(String userEmail, String trackingNumber) {
        User creator = authFacadeService.requireUser(userEmail);
        Shipment shipment = shipmentRepository.findByTrackingNumberAndCreator_Id(trackingNumber, creator.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shipment not found"));

        ShipmentStatus status = shipment.getStatus();
        if (status != ShipmentStatus.CREATED && status != ShipmentStatus.PAID && status != ShipmentStatus.READY_FOR_POSTING) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Shipment cannot be cancelled in status " + status
            );
        }

        workflowService.changeStatus(shipment, ShipmentStatus.CANCELED);

        TrackingEvent event = new TrackingEvent();
        event.setShipment(shipment);
        event.setStatus(ShipmentStatus.CANCELED.name());
        event.setLocationName("Client self-service");
        event.setDescription("Shipment cancelled by client");
        event.setEventTime(LocalDateTime.now());
        trackingEventRepository.save(event);

        shipmentRepository.save(shipment);

        return new ShipmentStateChangeResponse(shipment.getTrackingNumber(), ShipmentStatus.CANCELED.name());
    }

    private String generateTrackingNumber() {
        return "PW" + UUID.randomUUID().toString().replace("-", "").substring(0, 9).toUpperCase(Locale.ROOT) + "PL";
    }

    private boolean canRequestRedirect(Shipment shipment) {
        ShipmentStatus status = shipment.getStatus();
        return status == ShipmentStatus.CREATED
                || status == ShipmentStatus.PAID
                || status == ShipmentStatus.READY_FOR_POSTING
                || status == ShipmentStatus.POSTED
                || status == ShipmentStatus.IN_TRANSIT;
    }

    private String resolveLegacyDeliveryType(CreateClientShipmentRequest request) {
        String explicit = request.delivery().deliveryType();
        if (explicit != null && !explicit.isBlank()) {
            return explicit.trim().toUpperCase(Locale.ROOT);
        }
        return switch (normalizeRouteOption(request.delivery().deliveryMethod(), "deliveryMethod")) {
            case "PICKUP_POINT" -> "PICKUP_POINT";
            case "LOCKER_DEMO" -> "PARCEL_LOCKER";
            default -> "COURIER";
        };
    }

    private void validateRouteConfiguration(
            CreateClientShipmentRequest request,
            String intakeMethod,
            String deliveryMethod
    ) {
        if ("POINT_DROPOFF".equals(intakeMethod)
                && (request.delivery().sourcePointCode() == null || request.delivery().sourcePointCode().isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "sourcePointCode is required for POINT_DROPOFF intake");
        }
        if ("PICKUP_POINT".equals(deliveryMethod)
                && (request.delivery().targetPointCode() == null || request.delivery().targetPointCode().isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "targetPointCode is required for PICKUP_POINT delivery");
        }
        if ("LOCKER_DEMO".equals(deliveryMethod)
                && (request.delivery().targetPointCode() == null || request.delivery().targetPointCode().isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "targetPointCode is required for LOCKER_DEMO delivery");
        }
    }

    private String normalizeRouteOption(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " is required");
        }
        return value.trim().toUpperCase(Locale.ROOT);
    }
}
