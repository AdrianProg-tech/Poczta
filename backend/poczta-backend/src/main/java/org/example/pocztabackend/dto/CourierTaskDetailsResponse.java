package org.example.pocztabackend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CourierTaskDetailsResponse(
        UUID taskId,
        String trackingNumber,
        String taskType,
        String taskStatus,
        String shipmentStatus,
        String legacyShipmentStatus,
        String recipientName,
        String recipientPhone,
        String targetAddress,
        String currentNodeType,
        String currentNodeCode,
        LocalDate plannedDate,
        String paymentStatus,
        String paymentMethod,
        BigDecimal paymentAmount,
        String paymentCollectionMethod,
        boolean requiresPaymentCollection,
        List<TrackingHistoryItemResponse> history
) {
}
