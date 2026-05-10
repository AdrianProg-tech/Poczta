package org.example.pocztabackend.service;

import org.example.pocztabackend.dto.OfflinePaymentConfirmedResponse;
import org.example.pocztabackend.dto.PaymentResponse;
import org.example.pocztabackend.dto.PointCheckoutResponse;
import org.example.pocztabackend.dto.PointQueueItemResponse;
import org.example.pocztabackend.dto.PointQueueResponse;
import org.example.pocztabackend.dto.ShipmentStateChangeResponse;
import org.example.pocztabackend.model.Payment;
import org.example.pocztabackend.model.Point;
import org.example.pocztabackend.model.Shipment;
import org.example.pocztabackend.model.TrackingEvent;
import org.example.pocztabackend.model.enums.PaymentStatus;
import org.example.pocztabackend.model.enums.ShipmentStatus;
import org.example.pocztabackend.repository.PaymentRepository;
import org.example.pocztabackend.repository.PointRepository;
import org.example.pocztabackend.repository.ShipmentRepository;
import org.example.pocztabackend.repository.TrackingEventRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PointOperationContractService {

    private final PointRepository pointRepository;
    private final ShipmentRepository shipmentRepository;
    private final ShipmentWorkflowService shipmentWorkflowService;
    private final PaymentRepository paymentRepository;
    private final PaymentService paymentService;
    private final TrackingEventRepository trackingEventRepository;
    private final OperationalActorResolver operationalActorResolver;

    public PointOperationContractService(
            PointRepository pointRepository,
            ShipmentRepository shipmentRepository,
            ShipmentWorkflowService shipmentWorkflowService,
            PaymentRepository paymentRepository,
            PaymentService paymentService,
            TrackingEventRepository trackingEventRepository,
            OperationalActorResolver operationalActorResolver
    ) {
        this.pointRepository = pointRepository;
        this.shipmentRepository = shipmentRepository;
        this.shipmentWorkflowService = shipmentWorkflowService;
        this.paymentRepository = paymentRepository;
        this.paymentService = paymentService;
        this.trackingEventRepository = trackingEventRepository;
        this.operationalActorResolver = operationalActorResolver;
    }

    public PointQueueResponse getQueue(String userEmailHeader) {
        Point point = getPoint(userEmailHeader);

        List<PointQueueItemResponse> acceptQueue = shipmentRepository.findAll().stream()
                .filter(shipment -> canBeAcceptedAtPoint(shipment, point))
                .map(shipment -> toQueueItem(shipment, shipment.getStatus() == ShipmentStatus.REDIRECTED_TO_PICKUP ? "ACCEPT_REDIRECT" : "ACCEPT"))
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
            shipmentWorkflowService.changeStatus(shipment, ShipmentStatus.READY_FOR_POSTING);
            shipmentRepository.save(shipment);
            addTrackingEvent(shipment, ShipmentStatus.READY_FOR_POSTING, point.getName(), "Shipment accepted at point");
            return new ShipmentStateChangeResponse(shipment.getTrackingNumber(), shipment.getStatus().name());
        }

        if (shipment.getStatus() == ShipmentStatus.REDIRECTED_TO_PICKUP && samePoint(point, shipment.getTargetPoint())) {
            shipment.setCurrentPoint(point);
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

    private Point getPoint(String userEmailHeader) {
        return operationalActorResolver.requirePointActorPoint(userEmailHeader);
    }

    private Shipment getShipment(String trackingNumber) {
        return shipmentRepository.findByTrackingNumber(trackingNumber)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shipment not found"));
    }

    private PointQueueItemResponse toQueueItem(Shipment shipment, String queueType) {
        PaymentStatus latestPaymentStatus = paymentRepository.findAllByShipment_IdOrderByCreatedAtDesc(shipment.getId()).stream()
                .findFirst()
                .map(Payment::getStatus)
                .orElse(null);

        return new PointQueueItemResponse(
                shipment.getTrackingNumber(),
                queueType,
                shipment.getStatus() == null ? null : shipment.getStatus().name(),
                latestPaymentStatus == null ? null : latestPaymentStatus.name(),
                null,
                shipment.getRecipientName(),
                shipment.getCreatedAt(),
                null
        );
    }

    private PointQueueItemResponse toOfflinePaymentQueueItem(Payment payment) {
        Shipment shipment = payment.getShipment();

        return new PointQueueItemResponse(
                shipment == null ? null : shipment.getTrackingNumber(),
                "OFFLINE_PAYMENT",
                shipment == null || shipment.getStatus() == null ? null : shipment.getStatus().name(),
                payment.getStatus() == null ? null : payment.getStatus().name(),
                payment.getId(),
                shipment == null ? null : shipment.getRecipientName(),
                payment.getCreatedAt(),
                null
        );
    }

    private boolean canBeAcceptedAtPoint(Shipment shipment, Point point) {
        if (shipment.getStatus() == ShipmentStatus.REDIRECTED_TO_PICKUP) {
            return samePoint(point, shipment.getTargetPoint());
        }
        return belongsToPointHandling(shipment, point)
                && (shipment.getStatus() == ShipmentStatus.PAID || shipment.getStatus() == ShipmentStatus.READY_FOR_POSTING);
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
        return "PICKUP_POINT".equalsIgnoreCase(shipment.getDeliveryType())
                && samePoint(point, shipment.getTargetPoint());
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
