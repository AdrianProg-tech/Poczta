package org.example.pocztabackend.service;

import org.example.pocztabackend.dto.OfflinePaymentConfirmedResponse;
import org.example.pocztabackend.dto.PaymentResponse;
import org.example.pocztabackend.dto.PointCheckoutResponse;
import org.example.pocztabackend.dto.PointQueueItemResponse;
import org.example.pocztabackend.dto.PointQueueResponse;
import org.example.pocztabackend.dto.ShipmentStateChangeResponse;
import org.example.pocztabackend.dto.WalkInShipmentRequest;
import org.example.pocztabackend.dto.WalkInShipmentResponse;
import org.example.pocztabackend.model.Payment;
import org.example.pocztabackend.model.Point;
import org.example.pocztabackend.model.Role;
import org.example.pocztabackend.model.Shipment;
import org.example.pocztabackend.model.TrackingEvent;
import org.example.pocztabackend.model.User;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.example.pocztabackend.model.enums.PaymentStatus;
import org.example.pocztabackend.model.enums.ShipmentNodeType;
import org.example.pocztabackend.model.enums.ShipmentRouteStatus;
import org.example.pocztabackend.model.enums.ShipmentStatus;
import org.example.pocztabackend.repository.PaymentRepository;
import org.example.pocztabackend.repository.PointRepository;
import org.example.pocztabackend.repository.RoleRepository;
import org.example.pocztabackend.repository.ShipmentRepository;
import org.example.pocztabackend.repository.TrackingEventRepository;
import org.example.pocztabackend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;

@Service
public class PointOperationContractService {

    private final PointRepository pointRepository;
    private final ShipmentRepository shipmentRepository;
    private final ShipmentWorkflowService shipmentWorkflowService;
    private final PaymentRepository paymentRepository;
    private final PaymentService paymentService;
    private final TrackingEventRepository trackingEventRepository;
    private final OperationalActorResolver operationalActorResolver;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final ShipmentRoutingService shipmentRoutingService;

    public PointOperationContractService(
            PointRepository pointRepository,
            ShipmentRepository shipmentRepository,
            ShipmentWorkflowService shipmentWorkflowService,
            PaymentRepository paymentRepository,
            PaymentService paymentService,
            TrackingEventRepository trackingEventRepository,
            OperationalActorResolver operationalActorResolver,
            UserRepository userRepository,
            RoleRepository roleRepository,
            ShipmentRoutingService shipmentRoutingService
    ) {
        this.pointRepository = pointRepository;
        this.shipmentRepository = shipmentRepository;
        this.shipmentWorkflowService = shipmentWorkflowService;
        this.paymentRepository = paymentRepository;
        this.paymentService = paymentService;
        this.trackingEventRepository = trackingEventRepository;
        this.operationalActorResolver = operationalActorResolver;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.shipmentRoutingService = shipmentRoutingService;
    }

    public PointQueueResponse getQueue(String userEmailHeader) {
        Point point = getPoint(userEmailHeader);

        List<PointQueueItemResponse> acceptQueue = shipmentRepository.findAll().stream()
                .filter(shipment -> canBeAcceptedAtPoint(shipment, point))
                .map(shipment -> toQueueItem(shipment, resolveAcceptQueueType(shipment, point)))
                .toList();

        List<PointQueueItemResponse> pickupQueue = shipmentRepository.findAll().stream()
                .filter(shipment -> samePoint(point, shipment.getCurrentPoint()))
                .filter(shipment -> shipment.getStatus() == ShipmentStatus.AWAITING_PICKUP)
                .map(shipment -> toQueueItem(shipment, "PICKUP"))
                .toList();

        List<PointQueueItemResponse> offlinePaymentQueue = paymentRepository.findAll().stream()
                .filter(payment -> payment.getShipment() != null)
                .filter(payment -> isPointPaymentOwner(payment, point))
                .filter(payment -> payment.getStatus() == PaymentStatus.OFFLINE_PENDING)
                .map(payment -> toOfflinePaymentQueueItem(payment))
                .toList();

        return new PointQueueResponse(acceptQueue, pickupQueue, offlinePaymentQueue);
    }

    @Transactional
    public ShipmentStateChangeResponse acceptShipment(String userEmailHeader, String trackingNumber) {
        Point point = getPoint(userEmailHeader);
        Shipment shipment = getShipment(trackingNumber);

        if (shipment.getStatus() == ShipmentStatus.PAID) {
            shipment.setCurrentPoint(point);
            shipmentRoutingService.applyRouteState(shipment, ShipmentRouteStatus.ACCEPTED_AT_SOURCE, ShipmentNodeType.SOURCE_POINT, point.getPointCode());
            shipmentWorkflowService.changeStatus(shipment, ShipmentStatus.READY_FOR_POSTING);
            shipmentRepository.save(shipment);
            addTrackingEvent(shipment, ShipmentStatus.READY_FOR_POSTING, point.getName(), "Shipment accepted at point");
            return new ShipmentStateChangeResponse(shipment.getTrackingNumber(), shipment.getStatus().name());
        }

        if (isInboundToTargetPoint(shipment, point)) {
            shipment.setCurrentPoint(point);
            shipmentRoutingService.applyRouteState(shipment, ShipmentRouteStatus.AWAITING_PICKUP, ShipmentNodeType.TARGET_POINT, point.getPointCode());
            shipmentWorkflowService.changeStatus(shipment, ShipmentStatus.AWAITING_PICKUP);
            shipmentRepository.save(shipment);
            addTrackingEvent(shipment, ShipmentStatus.AWAITING_PICKUP, point.getName(), "Redirected shipment accepted into pickup queue");
            return new ShipmentStateChangeResponse(shipment.getTrackingNumber(), shipment.getStatus().name());
        }

        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Shipment cannot be accepted at point from current status");
    }

    @Transactional
    public ShipmentStateChangeResponse postShipment(String userEmailHeader, String trackingNumber) {
        Point point = getPoint(userEmailHeader);
        Shipment shipment = getShipment(trackingNumber);

        if (!samePoint(point, shipment.getCurrentPoint())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Shipment is not assigned to this point");
        }

        shipment.setCurrentPoint(null);
        shipmentRoutingService.applyRouteState(shipment, ShipmentRouteStatus.IN_TRANSIT_TO_DESTINATION_HUB, ShipmentNodeType.DESTINATION_HUB, resolveHubCode(shipment));
        shipmentWorkflowService.changeStatus(shipment, ShipmentStatus.POSTED);
        shipmentRepository.save(shipment);
        addTrackingEvent(shipment, ShipmentStatus.POSTED, point.getName(), "Shipment posted from point");

        return new ShipmentStateChangeResponse(shipment.getTrackingNumber(), shipment.getStatus().name());
    }

    @Transactional
    public ShipmentStateChangeResponse releaseShipment(String userEmailHeader, String trackingNumber) {
        Point point = getPoint(userEmailHeader);
        Shipment shipment = getShipment(trackingNumber);

        if (!samePoint(point, shipment.getCurrentPoint())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Shipment is not assigned to this point");
        }

        shipmentRoutingService.applyRouteState(shipment, ShipmentRouteStatus.DELIVERED, ShipmentNodeType.UNKNOWN, null);
        shipmentWorkflowService.changeStatus(shipment, ShipmentStatus.DELIVERED);
        shipmentRepository.save(shipment);
        addTrackingEvent(shipment, ShipmentStatus.DELIVERED, point.getName(), "Shipment released to recipient at point");

        return new ShipmentStateChangeResponse(shipment.getTrackingNumber(), shipment.getStatus().name());
    }

    @Transactional
    public OfflinePaymentConfirmedResponse confirmOfflinePayment(String userEmailHeader, java.util.UUID paymentId) {
        Point point = getPoint(userEmailHeader);
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));

        Shipment shipment = payment.getShipment();
        if (shipment == null || !isPointPaymentOwner(payment, point)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment is not available in this point queue");
        }

        PaymentResponse response = paymentService.confirmOfflinePayment(paymentId);
        return new OfflinePaymentConfirmedResponse(
                response.id(),
                response.status() == null ? null : response.status().name(),
                shipment.getStatus() == null ? null : shipment.getStatus().name()
        );
    }

    @Transactional
    public PointCheckoutResponse collectOfflinePaymentAndReleaseShipment(
            String userEmailHeader,
            String trackingNumber
    ) {
        Point point = getPoint(userEmailHeader);
        Shipment shipment = getShipment(trackingNumber);

        if (!belongsToPointHandling(shipment, point)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Shipment is not available in this point checkout flow");
        }
        if (shipment.getStatus() == ShipmentStatus.DELIVERED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Shipment is already delivered");
        }

        Payment payment = paymentRepository.findAllByShipment_IdOrderByCreatedAtDesc(shipment.getId()).stream()
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "No payment found for shipment"));

        if (payment.getStatus() != PaymentStatus.OFFLINE_PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Shipment does not require offline payment checkout");
        }

        PaymentResponse paymentResponse = paymentService.confirmOfflinePayment(payment.getId());

        if (!samePoint(point, shipment.getCurrentPoint())) {
            shipment.setCurrentPoint(point);
        }

        if (shipment.getStatus() == ShipmentStatus.PAID) {
            shipmentRoutingService.applyRouteState(shipment, ShipmentRouteStatus.AWAITING_PICKUP, ShipmentNodeType.TARGET_POINT, point.getPointCode());
            shipmentWorkflowService.changeStatus(shipment, ShipmentStatus.AWAITING_PICKUP);
            shipmentRepository.save(shipment);
            addTrackingEvent(
                    shipment,
                    ShipmentStatus.AWAITING_PICKUP,
                    point.getName(),
                    "Offline payment collected at point; shipment is ready for recipient release"
            );
        }

        if (shipment.getStatus() != ShipmentStatus.AWAITING_PICKUP) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Shipment is not ready for pickup release after offline payment confirmation"
            );
        }

        shipmentRoutingService.applyRouteState(shipment, ShipmentRouteStatus.DELIVERED, ShipmentNodeType.UNKNOWN, null);
        shipmentWorkflowService.changeStatus(shipment, ShipmentStatus.DELIVERED);
        shipmentRepository.save(shipment);
        addTrackingEvent(
                shipment,
                ShipmentStatus.DELIVERED,
                point.getName(),
                "Offline payment collected and shipment released to recipient at point"
        );

        return new PointCheckoutResponse(
                shipment.getTrackingNumber(),
                paymentResponse.id(),
                paymentResponse.status() == null ? null : paymentResponse.status().name(),
                shipment.getStatus() == null ? null : shipment.getStatus().name()
        );
    }

    @Transactional
    public WalkInShipmentResponse walkInShipment(String userEmailHeader, WalkInShipmentRequest request) {
        Point point = getPoint(userEmailHeader);
        User customer = resolveWalkInCustomer(request);

        Shipment shipment = new Shipment();
        shipment.setTrackingNumber(generateTrackingNumber());
        shipment.setStatus(ShipmentStatus.CREATED);
        shipment.setCreator(customer);
        shipment.setSenderName(request.senderName());
        shipment.setSenderPhone(request.senderPhone());
        shipment.setSenderAddress(request.senderAddress());
        shipment.setRecipientName(request.recipientName());
        shipment.setRecipientPhone(request.recipientPhone());
        shipment.setRecipientAddress(request.recipientAddress());
        shipment.setDeliveryType("COURIER");
        shipment.setIntakeMethod("POINT_DROPOFF");
        shipment.setDeliveryMethod("COURIER_HOME");
        shipment.setWeight(request.weight() != null ? request.weight() : BigDecimal.ONE);
        shipment.setSizeCategory(request.sizeCategory() != null ? request.sizeCategory() : "SMALL");
        shipment.setDeclaredValue(request.declaredValue() != null ? request.declaredValue() : BigDecimal.ZERO);
        shipment.setFragile(Boolean.TRUE.equals(request.fragile()));
        shipment.setCreatedAt(LocalDateTime.now());
        shipment.setEstimatedDeliveryDate(LocalDate.now().plusDays(2));
        shipment.setCurrentPoint(point);
        shipment.setSourcePoint(point);
        shipmentRoutingService.applyRouteState(shipment, ShipmentRouteStatus.ACCEPTED_AT_SOURCE, ShipmentNodeType.SOURCE_POINT, point.getPointCode());

        Shipment saved = shipmentRepository.save(shipment);

        // Calculate price
        BigDecimal amount = new BigDecimal("19.99");
        if (saved.getDeclaredValue() != null && saved.getDeclaredValue().signum() > 0) {
            amount = amount.add(new BigDecimal("5.00"));
        }
        if (Boolean.TRUE.equals(saved.getFragile())) {
            amount = amount.add(new BigDecimal("3.00"));
        }

        // Create payment as offline at point, then confirm immediately (cash in hand)
        Payment payment = new Payment();
        payment.setShipment(saved);
        payment.setAmount(amount);
        payment.setMethod("OFFLINE_AT_POINT");
        payment.setStatus(org.example.pocztabackend.model.enums.PaymentStatus.OFFLINE_PENDING);
        payment.setCreatedAt(LocalDateTime.now());
        payment.setExternalReference("WALKIN-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        Payment savedPayment = paymentRepository.save(payment);

        // Confirm payment immediately — cash was collected at counter
        savedPayment.setStatus(org.example.pocztabackend.model.enums.PaymentStatus.OFFLINE_CONFIRMED);
        paymentRepository.save(savedPayment);

        // CREATED → PAID → READY_FOR_POSTING
        shipmentWorkflowService.changeStatus(saved, ShipmentStatus.PAID);
        shipmentRepository.save(saved);
        shipmentWorkflowService.changeStatus(saved, ShipmentStatus.READY_FOR_POSTING);
        saved.setCurrentPoint(point);
        shipmentRoutingService.applyRouteState(saved, ShipmentRouteStatus.ACCEPTED_AT_SOURCE, ShipmentNodeType.SOURCE_POINT, point.getPointCode());
        shipmentRepository.save(saved);

        addTrackingEvent(saved, ShipmentStatus.READY_FOR_POSTING, point.getName(), "Walk-in shipment accepted and paid at point");

        return new WalkInShipmentResponse(
                saved.getTrackingNumber(),
                shipmentRoutingService.snapshot(saved, savedPayment, null).shipmentRouteStatus(),
                customer.getEmail(),
                savedPayment.getStatus().name(),
                amount,
                point.getPointCode(),
                point.getName()
        );
    }

    private String generateTrackingNumber() {
        return "PW" + java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 9).toUpperCase() + "PL";
    }

    private Point getPoint(String userEmailHeader) {
        return operationalActorResolver.requirePointActorPoint(userEmailHeader);
    }

    private Shipment getShipment(String trackingNumber) {
        return shipmentRepository.findByTrackingNumber(trackingNumber)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shipment not found"));
    }

    private PointQueueItemResponse toQueueItem(Shipment shipment, String queueType) {
        Payment latestPayment = getLatestPayment(shipment);
        PaymentStatus latestPaymentStatus = latestPayment == null ? null : latestPayment.getStatus();
        ShipmentRoutingSnapshot routing = shipmentRoutingService.snapshot(shipment, latestPayment, null);

        return new PointQueueItemResponse(
                shipment.getTrackingNumber(),
                queueType,
                routing.shipmentRouteStatus(),
                shipment.getStatus() == null ? null : shipment.getStatus().name(),
                latestPaymentStatus == null ? null : latestPaymentStatus.name(),
                null,
                shipment.getRecipientName(),
                routing.currentNodeType(),
                routing.currentNodeCode(),
                routing.nextOwner(),
                shipment.getCreatedAt(),
                null
        );
    }

    private PointQueueItemResponse toOfflinePaymentQueueItem(Payment payment) {
        Shipment shipment = payment.getShipment();
        ShipmentRoutingSnapshot routing = shipment == null ? null : shipmentRoutingService.snapshot(shipment, payment, null);

        return new PointQueueItemResponse(
                shipment == null ? null : shipment.getTrackingNumber(),
                "OFFLINE_PAYMENT",
                routing == null ? null : routing.shipmentRouteStatus(),
                shipment == null || shipment.getStatus() == null ? null : shipment.getStatus().name(),
                payment.getStatus() == null ? null : payment.getStatus().name(),
                payment.getId(),
                shipment == null ? null : shipment.getRecipientName(),
                routing == null ? null : routing.currentNodeType(),
                routing == null ? null : routing.currentNodeCode(),
                routing == null ? null : routing.nextOwner(),
                payment.getCreatedAt(),
                null
        );
    }

    private boolean canBeAcceptedAtPoint(Shipment shipment, Point point) {
        ShipmentRoutingSnapshot routing = shipmentRoutingService.snapshot(shipment, getLatestPayment(shipment), null);
        if ("IN_TRANSIT_TO_TARGET_POINT".equals(routing.shipmentRouteStatus())) {
            return samePoint(point, shipment.getTargetPoint());
        }
        if ("READY_FOR_HANDOVER".equals(routing.shipmentRouteStatus())
                || "ACCEPTED_AT_SOURCE".equals(routing.shipmentRouteStatus())) {
            return samePoint(point, shipment.getSourcePoint());
        }
        return false;
    }

    private String resolveAcceptQueueType(Shipment shipment, Point point) {
        ShipmentRoutingSnapshot routing = shipmentRoutingService.snapshot(shipment, getLatestPayment(shipment), null);
        if ("IN_TRANSIT_TO_TARGET_POINT".equals(routing.shipmentRouteStatus()) && samePoint(point, shipment.getTargetPoint())) {
            return "ACCEPT_REDIRECT";
        }
        if ("ACCEPTED_AT_SOURCE".equals(routing.shipmentRouteStatus())) {
            return "POST_FROM_SOURCE";
        }
        return "ACCEPT";
    }

    private boolean isPointPaymentOwner(Payment payment, Point point) {
        Shipment shipment = payment.getShipment();
        if (shipment == null) {
            return false;
        }
        if (!belongsToPointHandling(shipment, point)) {
            return false;
        }
        ShipmentStatus status = shipment.getStatus();
        return status != ShipmentStatus.DELIVERED
                && status != ShipmentStatus.CANCELED
                && status != ShipmentStatus.RETURNED;
    }

    private boolean belongsToPointHandling(Shipment shipment, Point point) {
        if (samePoint(point, shipment.getCurrentPoint())) {
            return true;
        }
        if (samePoint(point, shipment.getSourcePoint())) {
            return true;
        }
        return "PICKUP_POINT".equalsIgnoreCase(shipment.getDeliveryType())
                && samePoint(point, shipment.getTargetPoint());
    }

    private Payment getLatestPayment(Shipment shipment) {
        return paymentRepository.findAllByShipment_IdOrderByCreatedAtDesc(shipment.getId()).stream()
                .findFirst()
                .orElse(null);
    }

    private boolean isInboundToTargetPoint(Shipment shipment, Point point) {
        ShipmentRoutingSnapshot routing = shipmentRoutingService.snapshot(shipment, getLatestPayment(shipment), null);
        return "IN_TRANSIT_TO_TARGET_POINT".equals(routing.shipmentRouteStatus())
                && samePoint(point, shipment.getTargetPoint());
    }

    private String resolveHubCode(Shipment shipment) {
        String city = shipment.getTargetPoint() != null && shipment.getTargetPoint().getCity() != null
                ? shipment.getTargetPoint().getCity()
                : shipment.getRecipientAddress();
        if (city == null || city.isBlank()) {
            return "HUB-UNKNOWN";
        }
        int commaIndex = city.indexOf(',');
        String normalizedCity = (commaIndex >= 0 ? city.substring(0, commaIndex) : city).trim().toUpperCase(Locale.ROOT);
        return "HUB-" + normalizedCity;
    }

    private User resolveWalkInCustomer(WalkInShipmentRequest request) {
        String mode = request.customerMode() == null ? "NEW" : request.customerMode().trim().toUpperCase(Locale.ROOT);
        String email = request.customerEmail() == null ? null : request.customerEmail().trim().toLowerCase(Locale.ROOT);
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "customerEmail is required for walk-in flow");
        }

        if ("EXISTING".equals(mode)) {
            return userRepository.findByEmail(email)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Existing customer not found"));
        }

        return userRepository.findByEmail(email)
                .orElseGet(() -> {
                    User user = new User();
                    user.setEmail(email);
                    user.setPhone(request.senderPhone());
                    user.setActive(true);
                    user.setCreatedAt(LocalDateTime.now());
                    user.setFirstName(extractFirstName(request.senderName()));
                    user.setLastName(extractLastName(request.senderName()));
                    Role clientRole = roleRepository.findByName(RoleCatalog.CLIENT)
                            .orElseGet(() -> roleRepository.save(Role.builder()
                                    .name(RoleCatalog.CLIENT)
                                    .description("CLIENT role")
                                    .build()));
                    user.setRoles(new LinkedHashSet<>(List.of(clientRole)));
                    return userRepository.save(user);
                });
    }

    private String extractFirstName(String fullName) {
        if (fullName == null || fullName.isBlank()) {
            return "Walk-in";
        }
        return fullName.trim().split("\\s+")[0];
    }

    private String extractLastName(String fullName) {
        if (fullName == null || fullName.isBlank()) {
            return "Client";
        }
        String[] parts = fullName.trim().split("\\s+");
        return parts.length > 1 ? String.join(" ", Arrays.copyOfRange(parts, 1, parts.length)) : "Client";
    }

    private boolean samePoint(Point left, Point right) {
        if (left == null || right == null) {
            return false;
        }
        if (left.getPointCode() != null && right.getPointCode() != null) {
            return left.getPointCode().equalsIgnoreCase(right.getPointCode());
        }
        if (left.getId() != null && right.getId() != null) {
            return left.getId().equals(right.getId());
        }
        return false;
    }

    private void addTrackingEvent(Shipment shipment, ShipmentStatus status, String locationName, String description) {
        TrackingEvent event = new TrackingEvent();
        event.setShipment(shipment);
        event.setStatus(status.name());
        event.setLocationName(locationName);
        event.setDescription(description);
        event.setEventTime(LocalDateTime.now());
        trackingEventRepository.save(event);
    }
}
