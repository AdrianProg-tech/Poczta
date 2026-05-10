package org.example.pocztabackend.service;

import org.example.pocztabackend.dto.CompleteDeliveryRequest;
import org.example.pocztabackend.dto.CourierTaskDetailsResponse;
import org.example.pocztabackend.dto.CourierTaskListItemResponse;
import org.example.pocztabackend.dto.CourierTaskStateChangeResponse;
import org.example.pocztabackend.dto.DeliveryAttemptRecordedResponse;
import org.example.pocztabackend.dto.RecordDeliveryAttemptRequest;
import org.example.pocztabackend.dto.TrackingHistoryItemResponse;
import org.example.pocztabackend.model.CourierTask;
import org.example.pocztabackend.model.DeliveryAttempt;
import org.example.pocztabackend.model.Point;
import org.example.pocztabackend.model.Shipment;
import org.example.pocztabackend.model.TrackingEvent;
import org.example.pocztabackend.model.User;
import org.example.pocztabackend.model.enums.ShipmentStatus;
import org.example.pocztabackend.repository.CourierTaskRepository;
import org.example.pocztabackend.repository.DeliveryAttemptRepository;
import org.example.pocztabackend.repository.PointRepository;
import org.example.pocztabackend.repository.ShipmentRepository;
import org.example.pocztabackend.repository.TrackingEventRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class CourierTaskContractService {

    private final CourierTaskRepository courierTaskRepository;
    private final ShipmentRepository shipmentRepository;
    private final TrackingEventRepository trackingEventRepository;
    private final ShipmentWorkflowService shipmentWorkflowService;
    private final DeliveryAttemptRepository deliveryAttemptRepository;
    private final PointRepository pointRepository;
    private final OperationalActorResolver operationalActorResolver;

    public CourierTaskContractService(
            CourierTaskRepository courierTaskRepository,
            ShipmentRepository shipmentRepository,
            TrackingEventRepository trackingEventRepository,
            ShipmentWorkflowService shipmentWorkflowService,
            DeliveryAttemptRepository deliveryAttemptRepository,
            PointRepository pointRepository,
            OperationalActorResolver operationalActorResolver
    ) {
        this.courierTaskRepository = courierTaskRepository;
        this.shipmentRepository = shipmentRepository;
        this.trackingEventRepository = trackingEventRepository;
        this.shipmentWorkflowService = shipmentWorkflowService;
        this.deliveryAttemptRepository = deliveryAttemptRepository;
        this.pointRepository = pointRepository;
        this.operationalActorResolver = operationalActorResolver;
    }

    public List<CourierTaskListItemResponse> getCourierTasks(String userEmailHeader) {
        User courier = operationalActorResolver.requireCourierActor(userEmailHeader);

        return courierTaskRepository.findAllByCourier_IdOrderByTaskDateAscAssignedAtAsc(courier.getId()).stream()
                .map(CourierTaskListItemResponse::fromEntity)
                .toList();
    }

    public CourierTaskDetailsResponse getCourierTask(String userEmailHeader, UUID taskId) {
        CourierTask task = getTaskForCourier(userEmailHeader, taskId);

        List<TrackingHistoryItemResponse> history = task.getShipment() == null
                ? List.of()
                : trackingEventRepository.findAllByShipment_IdOrderByEventTimeDesc(task.getShipment().getId()).stream()
                .map(TrackingHistoryItemResponse::fromEntity)
                .toList();

        CourierTaskListItemResponse listItem = CourierTaskListItemResponse.fromEntity(task);
        return new CourierTaskDetailsResponse(
                listItem.taskId(),
                listItem.trackingNumber(),
                listItem.taskType(),
                listItem.taskStatus(),
                listItem.shipmentStatus(),
                listItem.recipientName(),
                listItem.recipientPhone(),
                listItem.targetAddress(),
                listItem.plannedDate(),
                history
        );
    }

    @Transactional
    public CourierTaskStateChangeResponse acceptCourierTask(String userEmailHeader, UUID taskId) {
        CourierTask task = getTaskForCourier(userEmailHeader, taskId);
        requireTaskStatus(task, "ASSIGNED");
        task.setStatus("ACCEPTED");
        courierTaskRepository.save(task);
        return toStateChangeResponse(task);
    }

    @Transactional
    public CourierTaskStateChangeResponse startCourierTask(String userEmailHeader, UUID taskId) {
        CourierTask task = getTaskForCourier(userEmailHeader, taskId);
        requireTaskStatus(task, "ACCEPTED");

        Shipment shipment = requireShipment(task);
        moveShipmentToOutForDelivery(shipment);

        task.setStatus("IN_PROGRESS");
        courierTaskRepository.save(task);
        return toStateChangeResponse(task);
    }

    @Transactional
    public CourierTaskStateChangeResponse completeDelivery(
            String userEmailHeader,
            UUID taskId,
            CompleteDeliveryRequest request
    ) {
        CourierTask task = getTaskForCourier(userEmailHeader, taskId);
        requireTaskStatus(task, "IN_PROGRESS");

        Shipment shipment = requireShipment(task);
        moveShipmentToOutForDelivery(shipment);
        shipmentWorkflowService.changeStatus(shipment, ShipmentStatus.DELIVERED);
        shipmentRepository.save(shipment);
        addTrackingEvent(
                shipment,
                ShipmentStatus.DELIVERED,
                "Delivered",
                withOptionalNote("Shipment delivered to recipient", request.note()),
                request.deliveredAt()
        );

        task.setStatus("COMPLETED");
        courierTaskRepository.save(task);
        return toStateChangeResponse(task);
    }

    @Transactional
    public DeliveryAttemptRecordedResponse recordAttempt(
            String userEmailHeader,
            UUID taskId,
            RecordDeliveryAttemptRequest request
    ) {
        CourierTask task = getTaskForCourier(userEmailHeader, taskId);
        requireTaskStatus(task, "IN_PROGRESS");

        Shipment shipment = requireShipment(task);
        moveShipmentToOutForDelivery(shipment);

        DeliveryAttempt attempt = new DeliveryAttempt();
        attempt.setShipment(shipment);
        attempt.setCourier(task.getCourier());
        attempt.setAttemptTime(LocalDateTime.now());
        attempt.setResult(normalizeAttemptResult(request.result()));
        attempt.setComment(request.note());
        DeliveryAttempt savedAttempt = deliveryAttemptRepository.save(attempt);

        shipmentWorkflowService.changeStatus(shipment, ShipmentStatus.DELIVERY_ATTEMPT);
        shipmentRepository.save(shipment);
        addTrackingEvent(
                shipment,
                ShipmentStatus.DELIVERY_ATTEMPT,
                "Delivery attempt",
                withOptionalNote("Delivery attempt failed: " + attempt.getResult(), request.note()),
                attempt.getAttemptTime()
        );

        if (Boolean.TRUE.equals(request.redirectToPickup())) {
            Point redirectPoint = resolveRedirectPoint(shipment, request.redirectPointCode());
            shipment.setTargetPoint(redirectPoint);
            shipment.setCurrentPoint(null);
            shipmentWorkflowService.changeStatus(shipment, ShipmentStatus.REDIRECTED_TO_PICKUP);
            shipmentRepository.save(shipment);
            addTrackingEvent(
                    shipment,
                    ShipmentStatus.REDIRECTED_TO_PICKUP,
                    "Redirected to pickup",
                    "Shipment redirected to pickup point " + redirectPoint.getPointCode() + " and is moving to point handling",
                    LocalDateTime.now()
            );
        }

        task.setStatus("FAILED");
        courierTaskRepository.save(task);

        return new DeliveryAttemptRecordedResponse(
                task.getId(),
                task.getStatus(),
                shipment.getStatus() == null ? null : shipment.getStatus().name(),
                savedAttempt.getId()
        );
    }

    private CourierTask getTaskForCourier(String userEmailHeader, UUID taskId) {
        User courier = operationalActorResolver.requireCourierActor(userEmailHeader);

        CourierTask task = courierTaskRepository.findById(taskId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Courier task not found"));

        if (task.getCourier() == null || !courier.getId().equals(task.getCourier().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Task is not assigned to this courier");
        }

        return task;
    }

    private Shipment requireShipment(CourierTask task) {
        if (task.getShipment() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Courier task has no shipment assigned");
        }
        return task.getShipment();
    }

    private void requireTaskStatus(CourierTask task, String expectedStatus) {
        String actualStatus = task.getStatus() == null ? null : task.getStatus().trim().toUpperCase(Locale.ROOT);
        if (!expectedStatus.equals(actualStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Invalid courier task transition: expected " + expectedStatus + " but was " + actualStatus
            );
        }
    }

    private CourierTaskStateChangeResponse toStateChangeResponse(CourierTask task) {
        return new CourierTaskStateChangeResponse(
                task.getId(),
                task.getStatus(),
                task.getShipment() == null || task.getShipment().getStatus() == null
                        ? null
                        : task.getShipment().getStatus().name()
        );
    }

    private void moveShipmentToOutForDelivery(Shipment shipment) {
        ShipmentStatus currentStatus = shipment.getStatus();
        if (currentStatus == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Shipment has no current status");
        }
        if (currentStatus == ShipmentStatus.OUT_FOR_DELIVERY) {
            return;
        }
        if (currentStatus == ShipmentStatus.READY_FOR_POSTING) {
            shipmentWorkflowService.changeStatus(shipment, ShipmentStatus.POSTED);
            shipmentRepository.save(shipment);
            addTrackingEvent(shipment, ShipmentStatus.POSTED, "Posted", "Shipment posted from point", LocalDateTime.now());
            currentStatus = shipment.getStatus();
        }
        if (currentStatus == ShipmentStatus.POSTED) {
            shipmentWorkflowService.changeStatus(shipment, ShipmentStatus.IN_TRANSIT);
            shipmentRepository.save(shipment);
            addTrackingEvent(shipment, ShipmentStatus.IN_TRANSIT, "In transit", "Shipment moved to linehaul transit", LocalDateTime.now());
            currentStatus = shipment.getStatus();
        }
        if (currentStatus == ShipmentStatus.IN_TRANSIT) {
            shipmentWorkflowService.changeStatus(shipment, ShipmentStatus.OUT_FOR_DELIVERY);
            shipmentRepository.save(shipment);
            addTrackingEvent(shipment, ShipmentStatus.OUT_FOR_DELIVERY, "Out for delivery", "Courier started the delivery route", LocalDateTime.now());
            return;
        }

        if (shipment.getStatus() != ShipmentStatus.OUT_FOR_DELIVERY) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Shipment is not ready for courier delivery from status " + shipment.getStatus()
            );
        }
    }

    private Point resolveRedirectPoint(Shipment shipment, String redirectPointCode) {
        if (redirectPointCode != null && !redirectPointCode.isBlank()) {
            return pointRepository.findByPointCode(redirectPointCode.trim().toUpperCase(Locale.ROOT))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Redirect point not found"));
        }
        if (shipment.getTargetPoint() != null) {
            return shipment.getTargetPoint();
        }
        if (shipment.getCurrentPoint() != null) {
            return shipment.getCurrentPoint();
        }
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "redirectPointCode is required when no shipment target point exists"
        );
    }

    private void addTrackingEvent(
            Shipment shipment,
            ShipmentStatus status,
            String locationName,
            String description,
            LocalDateTime eventTime
    ) {
        TrackingEvent event = new TrackingEvent();
        event.setShipment(shipment);
        event.setStatus(status.name());
        event.setLocationName(locationName);
        event.setDescription(description);
        event.setEventTime(eventTime);
        trackingEventRepository.save(event);
    }

    private String withOptionalNote(String baseMessage, String note) {
        if (note == null || note.isBlank()) {
            return baseMessage;
        }
        return baseMessage + ". Note: " + note.trim();
    }

    private String normalizeAttemptResult(String result) {
        return result == null ? "OTHER" : result.trim().toUpperCase(Locale.ROOT);
    }
}
