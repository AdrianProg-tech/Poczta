package org.example.pocztabackend.dto;

import java.util.UUID;

public record DeliveryAttemptRecordedResponse(
        UUID taskId,
        String taskStatus,
        String shipmentStatus,
        UUID deliveryAttemptId
) {
}
