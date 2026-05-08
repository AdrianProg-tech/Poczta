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
import org.example.pocztabackend.model.enums.PaymentStatus;
import org.example.pocztabackend.model.enums.ShipmentStatus;
import org.example.pocztabackend.repository.PaymentRepository;
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
    private final TrackingEventRepository trackingEventRepository;
    private final AuthFacadeService authFacadeService;

    public ContractShipmentQueryService(
            ShipmentRepository shipmentRepository,
            PaymentRepository paymentRepository,
            TrackingEventRepository trackingEventRepository,
            AuthFacadeService authFacadeService
    ) {
        this.shipmentRepository = shipmentRepository;
        this.paymentRepository = paymentRepository;
        this.trackingEventRepository = trackingEventRepository;
        this.authFacadeService = authFacadeService;
    }

    public List<ClientShipmentListItemResponse> getClientShipments(String userEmail) {
        User user = authFacadeService.requireUser(userEmail);
        return shipmentRepository.findAllByCreator_IdOrderByCreatedAtDesc(user.getId()).stream()
                .map(shipment -> ClientShipmentListItemResponse.from(shipment, getLatestPaymentStatus(shipment)))
                .toList();
    }

    public ClientShipmentDetailsResponse getShipmentDetails(String userEmail, String trackingNumber) {
        User user = authFacadeService.requireUser(userEmail);
        Shipment shipment = shipmentRepository.findByTrackingNumberAndCreator_Id(trackingNumber, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shipment not found"));

        Payment latestPayment = getLatestPayment(shipment);

        List<TrackingHistoryItemResponse> history = trackingEventRepository
                .findAllByShipment_IdOrderByEventTimeDesc(shipment.getId())
                .stream()
                .map(TrackingHistoryItemResponse::fromEntity)
                .toList();

        return new ClientShipmentDetailsResponse(
                shipment.getTrackingNumber(),
                shipment.getStatus() == null ? null : shipment.getStatus().name(),
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
                        latestPayment.getStatus() == null ? null : latestPayment.getStatus().name(),
                        latestPayment.getMethod(),
                        latestPayment.getAmount(),
                        latestPayment.getExternalReference()
                ),
                new ShipmentDeliveryDetailsResponse(
                        shipment.getDeliveryType(),
                        getPointCode(shipment.getCurrentPoint()),
                        getPointCode(shipment.getTargetPoint()),
                        shipment.getEstimatedDeliveryDate()
                ),
                history,
                getAllowedActions(shipment)
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

    private List<String> getAllowedActions(Shipment shipment) {
        List<String> actions = new ArrayList<>();
        actions.add("CREATE_COMPLAINT");

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
