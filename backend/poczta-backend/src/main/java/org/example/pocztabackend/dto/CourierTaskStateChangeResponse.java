package org.example.pocztabackend.dto;

import java.util.UUID;

public record CourierTaskStateChangeResponse(
        UUID taskId,
        String taskStatus,
        String shipmentStatus
) {
}
