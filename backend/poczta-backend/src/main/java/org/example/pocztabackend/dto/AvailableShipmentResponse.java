package org.example.pocztabackend.dto;

import org.example.pocztabackend.model.Shipment;

import java.time.LocalDateTime;
import java.util.UUID;

public record AvailableShipmentResponse(
        UUID shipmentId,
        String trackingNumber,
        String recipientName,
        String recipientAddress,
        String shipmentStatus,
        LocalDateTime createdAt
) {
    public static AvailableShipmentResponse fromEntity(Shipment shipment) {
        return new AvailableShipmentResponse(
                shipment.getId(),
                shipment.getTrackingNumber(),
                shipment.getRecipientName(),
                shipment.getRecipientAddress(),
                shipment.getStatus() == null ? null : shipment.getStatus().name(),
                shipment.getCreatedAt()
        );
    }
}
