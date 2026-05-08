package org.example.pocztabackend.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CourierTaskDetailsResponse(
        UUID taskId,
        String trackingNumber,
        String taskType,
        String taskStatus,
        String shipmentStatus,
        String recipientName,
        String recipientPhone,
        String targetAddress,
        LocalDate plannedDate,
        List<TrackingHistoryItemResponse> history
) {
}
