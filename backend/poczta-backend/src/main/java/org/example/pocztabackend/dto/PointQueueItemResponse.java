package org.example.pocztabackend.dto;

import java.time.LocalDateTime;

public record PointQueueItemResponse(
        String trackingNumber,
        String queueType,
        String shipmentStatus,
        String paymentStatus,
        java.util.UUID paymentId,
        String recipientName,
        LocalDateTime createdAt,
        LocalDateTime expiresAt
) {
}
