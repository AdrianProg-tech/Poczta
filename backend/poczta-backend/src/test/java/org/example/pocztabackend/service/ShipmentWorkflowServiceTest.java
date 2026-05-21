package org.example.pocztabackend.service;

import org.example.pocztabackend.model.Shipment;
import org.example.pocztabackend.model.enums.ShipmentStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class ShipmentWorkflowServiceTest {

    @Mock
    private NotificationService notificationService;

    private ShipmentWorkflowService shipmentWorkflowService;

    @BeforeEach
    void setUp() {
        shipmentWorkflowService = new ShipmentWorkflowService(notificationService);
    }

    @Test
    void shouldAllowValidTransitionFromCreatedToPaid() {
        Shipment shipment = new Shipment();
        shipment.setStatus(ShipmentStatus.CREATED);

        ShipmentStatus result = shipmentWorkflowService.changeStatus(shipment, ShipmentStatus.PAID);

        assertEquals(ShipmentStatus.PAID, result);
        assertEquals(ShipmentStatus.PAID, shipment.getStatus());
    }

    @Test
    void shouldRejectInvalidTransitionFromCreatedToDelivered() {
        Shipment shipment = new Shipment();
        shipment.setStatus(ShipmentStatus.CREATED);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> shipmentWorkflowService.changeStatus(shipment, ShipmentStatus.DELIVERED)
        );

        assertEquals(400, exception.getStatusCode().value());
    }

    @Test
    void shouldAcceptInitialStatusWhenShipmentHasNoStatusYet() {
        Shipment shipment = new Shipment();

        ShipmentStatus result = shipmentWorkflowService.changeStatus(shipment, ShipmentStatus.REGISTERED);

        assertEquals(ShipmentStatus.REGISTERED, result);
        assertEquals(ShipmentStatus.REGISTERED, shipment.getStatus());
    }

    @Test
    void shouldAllowCancellationFromCreatedStatus() {
        Shipment shipment = new Shipment();
        shipment.setStatus(ShipmentStatus.CREATED);

        ShipmentStatus result = shipmentWorkflowService.changeStatus(shipment, ShipmentStatus.CANCELED);

        assertEquals(ShipmentStatus.CANCELED, result);
    }

    @Test
    void shouldAllowFullDeliveryChain() {
        Shipment shipment = new Shipment();
        shipment.setStatus(ShipmentStatus.IN_TRANSIT);

        shipmentWorkflowService.changeStatus(shipment, ShipmentStatus.OUT_FOR_DELIVERY);
        assertEquals(ShipmentStatus.OUT_FOR_DELIVERY, shipment.getStatus());

        shipmentWorkflowService.changeStatus(shipment, ShipmentStatus.DELIVERED);
        assertEquals(ShipmentStatus.DELIVERED, shipment.getStatus());
    }

    @Test
    void shouldNotAllowTransitionFromDelivered() {
        Shipment shipment = new Shipment();
        shipment.setStatus(ShipmentStatus.DELIVERED);

        assertThrows(
                ResponseStatusException.class,
                () -> shipmentWorkflowService.changeStatus(shipment, ShipmentStatus.IN_TRANSIT)
        );
    }

    @Test
    void shouldThrowWhenTargetStatusIsNull() {
        Shipment shipment = new Shipment();
        shipment.setStatus(ShipmentStatus.CREATED);

        assertThrows(
                ResponseStatusException.class,
                () -> shipmentWorkflowService.changeStatus(shipment, null)
        );
    }

    @Test
    void shouldReturnSameStatusForNoOpTransition() {
        Shipment shipment = new Shipment();
        shipment.setStatus(ShipmentStatus.PAID);

        ShipmentStatus result = shipmentWorkflowService.changeStatus(shipment, ShipmentStatus.PAID);

        assertEquals(ShipmentStatus.PAID, result);
    }
}
