package org.example.pocztabackend.service;

import org.example.pocztabackend.dto.AdminAssignCourierRequest;
import org.example.pocztabackend.dto.AdminAssignCourierResponse;
import org.example.pocztabackend.dto.ShipmentStateChangeResponse;
import org.example.pocztabackend.model.CourierTask;
import org.example.pocztabackend.model.Shipment;
import org.example.pocztabackend.model.TrackingEvent;
import org.example.pocztabackend.model.User;
import org.example.pocztabackend.model.enums.ShipmentStatus;
import org.example.pocztabackend.repository.CourierTaskRepository;
import org.example.pocztabackend.repository.ShipmentRepository;
import org.example.pocztabackend.repository.TrackingEventRepository;
import org.example.pocztabackend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class DispatchOperationsService {

    private final ShipmentRepository shipmentRepository;
    private final CourierTaskRepository courierTaskRepository;
    private final UserRepository userRepository;
    private final ShipmentWorkflowService shipmentWorkflowService;
    private final TrackingEventRepository trackingEventRepository;

    public DispatchOperationsService(
            ShipmentRepository shipmentRepository,
            CourierTaskRepository courierTaskRepository,
            UserRepository userRepository,
            ShipmentWorkflowService shipmentWorkflowService,
            TrackingEventRepository trackingEventRepository
    ) {
        this.shipmentRepository = shipmentRepository;
        this.courierTaskRepository = courierTaskRepository;
        this.userRepository = userRepository;
        this.shipmentWorkflowService = shipmentWorkflowService;
        this.trackingEventRepository = trackingEventRepository;
    }

    @Transactional
    public ShipmentStateChangeResponse prepareForDispatch(UUID shipmentId) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shipment not found"));

        if (shipment.getStatus() != ShipmentStatus.PAID) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only paid shipments can be prepared for dispatch");
        }

        shipmentWorkflowService.changeStatus(shipment, ShipmentStatus.READY_FOR_POSTING);
        shipmentRepository.save(shipment);

        TrackingEvent event = new TrackingEvent();
        event.setShipment(shipment);
        event.setStatus(ShipmentStatus.READY_FOR_POSTING.name());
        event.setLocationName("Operations preparation");
        event.setDescription("Shipment prepared for dispatch by operations");
        event.setEventTime(LocalDateTime.now());
        trackingEventRepository.save(event);

        return new ShipmentStateChangeResponse(
                shipment.getTrackingNumber(),
                shipment.getStatus().name()
        );
    }

    @Transactional
    public AdminAssignCourierResponse assignCourier(UUID shipmentId, AdminAssignCourierRequest request) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shipment not found"));

        if (!"COURIER".equalsIgnoreCase(shipment.getDeliveryType())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only courier shipments can be assigned to courier dispatch");
        }
        if (shipment.getStatus() != ShipmentStatus.READY_FOR_POSTING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only shipments ready for posting can be assigned to courier");
        }
        if (hasActiveCourierTask(shipment.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Shipment already has an active courier task");
        }

        User courier = userRepository.findById(request.courierId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Courier user not found"));

        CourierTask task = new CourierTask();
        task.setShipment(shipment);
        task.setCourier(courier);
        task.setTaskDate(request.taskDate());
        task.setAssignedAt(LocalDateTime.now());
        task.setStatus("ASSIGNED");

        CourierTask savedTask = courierTaskRepository.save(task);
        addTrackingEvent(
                shipment,
                shipment.getStatus(),
                "Courier assignment",
                "Shipment assigned to courier " + courier.getEmail(),
                LocalDateTime.now()
        );

        return new AdminAssignCourierResponse(shipment.getId(), courier.getId(), savedTask.getId());
    }

    @Transactional
    public AdminAssignCourierResponse reassignCourier(UUID shipmentId, AdminAssignCourierRequest request) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shipment not found"));

        if (!"COURIER".equalsIgnoreCase(shipment.getDeliveryType())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only courier shipments can be reassigned in courier dispatch");
        }
        if (shipment.getStatus() != ShipmentStatus.READY_FOR_POSTING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only shipments waiting before route start can be reassigned");
        }

        CourierTask latestTask = courierTaskRepository.findAllByShipment_IdOrderByAssignedAtDesc(shipmentId).stream()
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "Shipment has no courier task to reassign"));

        String latestStatus = normalizeStatus(latestTask.getStatus());
        if (!latestStatus.equals("ASSIGNED") && !latestStatus.equals("ACCEPTED")) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only assigned or accepted courier tasks can be reassigned");
        }

        User newCourier = userRepository.findById(request.courierId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Courier user not found"));

        if (latestTask.getCourier() != null && latestTask.getCourier().getId().equals(newCourier.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Shipment is already assigned to this courier");
        }

        latestTask.setStatus("CANCELED");
        courierTaskRepository.save(latestTask);

        CourierTask newTask = new CourierTask();
        newTask.setShipment(shipment);
        newTask.setCourier(newCourier);
        newTask.setTaskDate(request.taskDate());
        newTask.setAssignedAt(LocalDateTime.now());
        newTask.setStatus("ASSIGNED");
        CourierTask savedTask = courierTaskRepository.save(newTask);

        String previousCourierEmail = latestTask.getCourier() == null ? "unknown courier" : latestTask.getCourier().getEmail();
        addTrackingEvent(
                shipment,
                shipment.getStatus(),
                "Courier reassignment",
                "Shipment reassigned from " + previousCourierEmail + " to courier " + newCourier.getEmail(),
                LocalDateTime.now()
        );

        return new AdminAssignCourierResponse(shipment.getId(), newCourier.getId(), savedTask.getId());
    }

    private boolean hasActiveCourierTask(UUID shipmentId) {
        List<CourierTask> tasks = courierTaskRepository.findAllByShipment_IdOrderByAssignedAtDesc(shipmentId);
        return tasks.stream()
                .map(CourierTask::getStatus)
                .map(this::normalizeStatus)
                .anyMatch(status -> status.equals("ASSIGNED") || status.equals("ACCEPTED") || status.equals("IN_PROGRESS"));
    }

    private String normalizeStatus(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
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
}
