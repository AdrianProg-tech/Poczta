package org.example.pocztabackend.service;

import org.example.pocztabackend.dto.ClientShipmentDetailsResponse;
import org.example.pocztabackend.dto.ClientShipmentListItemResponse;
import org.example.pocztabackend.dto.ShipmentContactResponse;
import org.example.pocztabackend.dto.ShipmentDeliveryDetailsResponse;
import org.example.pocztabackend.dto.ShipmentParcelResponse;
import org.example.pocztabackend.dto.ShipmentPaymentDetailsResponse;
import org.example.pocztabackend.dto.TrackingHistoryItemResponse;
import org.example.pocztabackend.model.Payment;
import org.example.pocztabackend.model.Point;
import org.example.pocztabackend.model.Shipment;
import org.example.pocztabackend.model.User;
import org.example.pocztabackend.model.CourierTask;
import org.example.pocztabackend.model.enums.PaymentStatus;
import org.example.pocztabackend.model.enums.ShipmentStatus;
import org.example.pocztabackend.repository.PaymentRepository;
import org.example.pocztabackend.repository.CourierTaskRepository;
import org.example.pocztabackend.repository.ShipmentRepository;
import org.example.pocztabackend.repository.TrackingEventRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.ArrayList;

@Service
public class ContractShipmentQueryService {

    private final ShipmentRepository shipmentRepository;
    private final PaymentRepository paymentRepository;
    private final CourierTaskRepository courierTaskRepository;
    private final TrackingEventRepository trackingEventRepository;
    private final AuthFacadeService authFacadeService;
    private final ShipmentRoutingService shipmentRoutingService;

    public ContractShipmentQueryService(
            ShipmentRepository shipmentRepository,
            PaymentRepository paymentRepository,
            CourierTaskRepository courierTaskRepository,
            TrackingEventRepository trackingEventRepository,
            AuthFacadeService authFacadeService,
            ShipmentRoutingService shipmentRoutingService
    ) {
        this.shipmentRepository = shipmentRepository;
        this.paymentRepository = paymentRepository;
        this.courierTaskRepository = courierTaskRepository;
        this.trackingEventRepository = trackingEventRepository;
        this.authFacadeService = authFacadeService;
        this.shipmentRoutingService = shipmentRoutingService;
    }

    public List<ClientShipmentListItemResponse> getClientShipments(String userEmail) {
        User user = authFacadeService.requireUser(userEmail);
        return shipmentRepository.findAllByCreator_IdOrderByCreatedAtDesc(user.getId()).stream()
                .map(shipment -> {
                    ShipmentRoutingSnapshot routing = shipmentRoutingService.snapshot(
                            shipment,
                            getLatestPayment(shipment),
                            findLatestTask(shipment)
                    );
                    return ClientShipmentListItemResponse.from(
                            shipment,
                            getLatestPaymentStatus(shipment),
                            routing.shipmentRouteStatus(),
                            routing.nextOwner()
                    );
                })
                .toList();
    }

    public ClientShipmentDetailsResponse getShipmentDetails(String userEmail, String trackingNumber) {
        User user = authFacadeService.requireUser(userEmail);
        Shipment shipment = shipmentRepository.findByTrackingNumberAndCreator_Id(trackingNumber, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shipment not found"));

        Payment latestPayment = getLatestPayment(shipment);
        ShipmentRoutingSnapshot routing = shipmentRoutingService.snapshot(shipment, latestPayment, findLatestTask(shipment));

        List<TrackingHistoryItemResponse> history = trackingEventRepository
                .findAllByShipment_IdOrderByEventTimeDesc(shipment.getId())
                .stream()
                .map(TrackingHistoryItemResponse::fromEntity)
                .toList();

        return new ClientShipmentDetailsResponse(
                shipment.getTrackingNumber(),
                routing.shipmentRouteStatus(),
                routing.nextOwner(),
                new ShipmentContactResponse(
                        shipment.getSenderName(),
                        shipment.getSenderPhone(),
                        shipment.getSenderAddress()
                ),
                new ShipmentContactResponse(
                        shipment.getRecipientName(),
                        shipment.getRecipientPhone(),
                        shipment.getRecipientAddress()
                ),
                new ShipmentParcelResponse(
                        shipment.getWeight(),
                        shipment.getSizeCategory(),
                        shipment.getDeclaredValue(),
                        shipment.getFragile()
                ),
                latestPayment == null
                        ? null
                        : new ShipmentPaymentDetailsResponse(
                        latestPayment.getId(),
                        latestPayment.getStatus() == null ? null : latestPayment.getStatus().name(),
                        latestPayment.getMethod(),
                        latestPayment.getAmount(),
                        latestPayment.getCollectionMethod(),
                        latestPayment.getExternalReference()
                ),
                new ShipmentDeliveryDetailsResponse(
                        shipment.getDeliveryType(),
                        routing.intakeMethod(),
                        routing.deliveryMethod(),
                        routing.shipmentRouteStatus(),
                        routing.currentNodeType(),
                        routing.currentNodeCode(),
                        getPointCode(shipment.getSourcePoint()),
                        getPointCode(shipment.getCurrentPoint()),
                        getPointCode(shipment.getTargetPoint()),
                        shipment.getEstimatedDeliveryDate()
                ),
                history,
                getAllowedActions(shipment, routing)
        );
    }

    private PaymentStatus getLatestPaymentStatus(Shipment shipment) {
        Payment latestPayment = getLatestPayment(shipment);
        return latestPayment == null ? null : latestPayment.getStatus();
    }

    private Payment getLatestPayment(Shipment shipment) {
        return paymentRepository.findAllByShipment_IdOrderByCreatedAtDesc(shipment.getId()).stream()
                .findFirst()
                .orElse(null);
    }

    private String getPointCode(Point point) {
        return point == null ? null : point.getPointCode();
    }

    private CourierTask findLatestTask(Shipment shipment) {
        return courierTaskRepository.findAllByShipment_IdOrderByAssignedAtDesc(shipment.getId()).stream()
                .findFirst()
                .orElse(null);
    }

    private List<String> getAllowedActions(Shipment shipment, ShipmentRoutingSnapshot routing) {
        List<String> actions = new ArrayList<>(routing.availableActions());
        if (!actions.contains("CREATE_COMPLAINT")) {
            actions.add("CREATE_COMPLAINT");
        }

        ShipmentStatus status = shipment.getStatus();
        if (status == ShipmentStatus.CREATED
                || status == ShipmentStatus.PAID
                || status == ShipmentStatus.READY_FOR_POSTING
                || status == ShipmentStatus.POSTED
                || status == ShipmentStatus.IN_TRANSIT) {
            actions.add("REQUEST_REDIRECTION");
        }

        return actions;
    }
}
