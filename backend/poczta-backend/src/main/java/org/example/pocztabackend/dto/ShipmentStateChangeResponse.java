package org.example.pocztabackend.dto;

public record ShipmentStateChangeResponse(
        String trackingNumber,
        String shipmentStatus
) {
}
