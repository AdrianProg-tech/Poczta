package org.example.pocztabackend.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record OpsShipmentBoardItemResponse(
        UUID shipmentId,
        String trackingNumber,
        String shipmentStatus,
        String paymentStatus,
        String deliveryType,
        String sourceCity,
        String destinationCity,
        String targetPointCode,
        String assignedCourierEmail,
        String nextActionOwner,
        String nextSuggestedAction,
        String blockedReason,
        LocalDateTime createdAt
) {
}
