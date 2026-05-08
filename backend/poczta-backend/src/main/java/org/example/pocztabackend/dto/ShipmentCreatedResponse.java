package org.example.pocztabackend.dto;

import java.util.UUID;

public record ShipmentCreatedResponse(
        String trackingNumber,
        UUID shipmentId,
        String currentStatus,
        String paymentStatus
) {
}
