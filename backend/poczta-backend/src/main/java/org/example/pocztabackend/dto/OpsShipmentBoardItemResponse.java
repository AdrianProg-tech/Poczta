package org.example.pocztabackend.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record OpsShipmentBoardItemResponse(
        UUID shipmentId,
        String trackingNumber,
        String shipmentStatus,
        String legacyShipmentStatus,
        String paymentStatus,
        String deliveryType,
        String intakeMethod,
        String deliveryMethod,
        String sourceCity,
        String destinationCity,
        String sourcePointCode,
        String targetPointCode,
        String currentNodeType,
        String currentNodeCode,
        String assignedCourierEmail,
        String activeTaskType,
        String nextActionOwner,
        String nextSuggestedAction,
        String blockedReason,
        LocalDateTime createdAt
) {
}
