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
        String currentNodeType,
        String currentNodeCode,
        LocalDateTime createdAt
) {
    public static AvailableShipmentResponse fromEntity(
            Shipment shipment,
            String shipmentStatus,
            String currentNodeType,
            String currentNodeCode
    ) {
        return new AvailableShipmentResponse(
                shipment.getId(),
                shipment.getTrackingNumber(),
                shipment.getRecipientName(),
                shipment.getRecipientAddress(),
                shipmentStatus,
                currentNodeType,
                currentNodeCode,
                shipment.getCreatedAt()
        );
    }
}
