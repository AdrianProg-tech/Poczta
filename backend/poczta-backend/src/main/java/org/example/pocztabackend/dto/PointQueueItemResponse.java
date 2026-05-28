package org.example.pocztabackend.dto;

import java.time.LocalDateTime;

public record PointQueueItemResponse(
        String trackingNumber,
        String queueType,
        String shipmentStatus,
        String legacyShipmentStatus,
        String paymentStatus,
        java.util.UUID paymentId,
        String recipientName,
        String currentNodeType,
        String currentNodeCode,
        String nextOwner,
        LocalDateTime createdAt,
        LocalDateTime expiresAt
) {
}
