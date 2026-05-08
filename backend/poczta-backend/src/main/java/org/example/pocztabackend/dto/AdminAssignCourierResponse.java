package org.example.pocztabackend.dto;

import java.util.UUID;

public record AdminAssignCourierResponse(
        UUID shipmentId,
        UUID assignedCourierId,
        UUID createdTaskId
) {
}
