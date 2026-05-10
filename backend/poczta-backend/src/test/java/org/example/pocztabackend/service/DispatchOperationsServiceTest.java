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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DispatchOperationsServiceTest {

    @Mock
    private ShipmentRepository shipmentRepository;

    @Mock
    private CourierTaskRepository courierTaskRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TrackingEventRepository trackingEventRepository;

    private DispatchOperationsService dispatchOperationsService;

    @BeforeEach
    void setUp() {
        dispatchOperationsService = new DispatchOperationsService(
                shipmentRepository,
                courierTaskRepository,
                userRepository,
                new ShipmentWorkflowService(),
                trackingEventRepository
        );
    }

    @Test
    void shouldPreparePaidShipmentForDispatch() {
        UUID shipmentId = UUID.randomUUID();
        Shipment shipment = new Shipment();
        shipment.setId(shipmentId);
        shipment.setTrackingNumber("PWTEST123PL");
        shipment.setStatus(ShipmentStatus.PAID);

        when(shipmentRepository.findById(shipmentId)).thenReturn(Optional.of(shipment));
        when(shipmentRepository.save(any(Shipment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ShipmentStateChangeResponse response = dispatchOperationsService.prepareForDispatch(shipmentId);

        assertEquals("PWTEST123PL", response.trackingNumber());
        assertEquals(ShipmentStatus.READY_FOR_POSTING.name(), response.shipmentStatus());
        assertEquals(ShipmentStatus.READY_FOR_POSTING, shipment.getStatus());
        verify(trackingEventRepository).save(any(TrackingEvent.class));
    }

    @Test
    void shouldAssignCourierWhenShipmentIsReadyAndNoActiveTaskExists() {
        UUID shipmentId = UUID.randomUUID();
        UUID courierId = UUID.randomUUID();

        Shipment shipment = new Shipment();
        shipment.setId(shipmentId);
        shipment.setStatus(ShipmentStatus.READY_FOR_POSTING);
        shipment.setDeliveryType("COURIER");

        User courier = new User();
        courier.setId(courierId);
        courier.setEmail("courier.warsaw.1@example.com");

        when(shipmentRepository.findById(shipmentId)).thenReturn(Optional.of(shipment));
        when(courierTaskRepository.findAllByShipment_IdOrderByAssignedAtDesc(shipmentId)).thenReturn(List.of());
        when(userRepository.findById(courierId)).thenReturn(Optional.of(courier));
        when(courierTaskRepository.save(any(CourierTask.class))).thenAnswer(invocation -> {
            CourierTask task = invocation.getArgument(0);
            task.setId(UUID.randomUUID());
            return task;
        });

        AdminAssignCourierResponse response = dispatchOperationsService.assignCourier(
                shipmentId,
                new AdminAssignCourierRequest(courierId, LocalDate.of(2026, 5, 10))
        );

        assertEquals(shipmentId, response.shipmentId());
        assertEquals(courierId, response.assignedCourierId());

        ArgumentCaptor<CourierTask> taskCaptor = ArgumentCaptor.forClass(CourierTask.class);
        verify(courierTaskRepository).save(taskCaptor.capture());
        assertEquals("ASSIGNED", taskCaptor.getValue().getStatus());
        assertEquals(courierId, taskCaptor.getValue().getCourier().getId());
        verify(trackingEventRepository).save(any(TrackingEvent.class));
    }

    @Test
    void shouldRejectAssignmentWhenShipmentAlreadyHasActiveTask() {
        UUID shipmentId = UUID.randomUUID();
        UUID courierId = UUID.randomUUID();

        Shipment shipment = new Shipment();
        shipment.setId(shipmentId);
        shipment.setStatus(ShipmentStatus.READY_FOR_POSTING);
        shipment.setDeliveryType("COURIER");

        CourierTask activeTask = new CourierTask();
        activeTask.setStatus("IN_PROGRESS");

        when(shipmentRepository.findById(shipmentId)).thenReturn(Optional.of(shipment));
        when(courierTaskRepository.findAllByShipment_IdOrderByAssignedAtDesc(shipmentId)).thenReturn(List.of(activeTask));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> dispatchOperationsService.assignCourier(
                        shipmentId,
                        new AdminAssignCourierRequest(courierId, LocalDate.of(2026, 5, 10))
                )
        );

        assertEquals(409, exception.getStatusCode().value());
        verify(courierTaskRepository, never()).save(any(CourierTask.class));
    }

    @Test
    void shouldReassignCourierWhenLatestTaskWasNotStarted() {
        UUID shipmentId = UUID.randomUUID();
        UUID oldCourierId = UUID.randomUUID();
        UUID newCourierId = UUID.randomUUID();

        Shipment shipment = new Shipment();
        shipment.setId(shipmentId);
        shipment.setStatus(ShipmentStatus.READY_FOR_POSTING);
        shipment.setDeliveryType("COURIER");

        User oldCourier = new User();
        oldCourier.setId(oldCourierId);
        oldCourier.setEmail("courier.warsaw.1@example.com");

        User newCourier = new User();
        newCourier.setId(newCourierId);
        newCourier.setEmail("courier.warsaw.2@example.com");

        CourierTask existingTask = new CourierTask();
        existingTask.setId(UUID.randomUUID());
        existingTask.setCourier(oldCourier);
        existingTask.setShipment(shipment);
        existingTask.setStatus("ASSIGNED");
        existingTask.setTaskDate(LocalDate.of(2026, 5, 10));

        when(shipmentRepository.findById(shipmentId)).thenReturn(Optional.of(shipment));
        when(courierTaskRepository.findAllByShipment_IdOrderByAssignedAtDesc(shipmentId)).thenReturn(List.of(existingTask));
        when(userRepository.findById(newCourierId)).thenReturn(Optional.of(newCourier));
        when(courierTaskRepository.save(any(CourierTask.class))).thenAnswer(invocation -> {
            CourierTask task = invocation.getArgument(0);
            if (task.getId() == null) {
                task.setId(UUID.randomUUID());
            }
            return task;
        });

        AdminAssignCourierResponse response = dispatchOperationsService.reassignCourier(
                shipmentId,
                new AdminAssignCourierRequest(newCourierId, LocalDate.of(2026, 5, 11))
        );

        assertEquals(shipmentId, response.shipmentId());
        assertEquals(newCourierId, response.assignedCourierId());
        assertEquals("CANCELED", existingTask.getStatus());
        verify(courierTaskRepository).save(argThat(task ->
                task.getId() != null
                        && "CANCELED".equals(task.getStatus())
                        && task.getCourier() != null
                        && oldCourierId.equals(task.getCourier().getId())
        ));
        verify(courierTaskRepository).save(argThat(task ->
                "ASSIGNED".equals(task.getStatus())
                        && task.getCourier() != null
                        && newCourierId.equals(task.getCourier().getId())
                        && LocalDate.of(2026, 5, 11).equals(task.getTaskDate())
        ));
        verify(trackingEventRepository).save(argThat(event ->
                event.getDescription() != null && event.getDescription().contains("reassigned from")
        ));
    }
}
