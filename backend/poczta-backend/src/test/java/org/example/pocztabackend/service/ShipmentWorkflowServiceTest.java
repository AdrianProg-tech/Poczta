package org.example.pocztabackend.service;

import org.example.pocztabackend.model.Shipment;
import org.example.pocztabackend.model.enums.ShipmentStatus;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ShipmentWorkflowServiceTest {

    private final ShipmentWorkflowService shipmentWorkflowService = new ShipmentWorkflowService();

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
}
