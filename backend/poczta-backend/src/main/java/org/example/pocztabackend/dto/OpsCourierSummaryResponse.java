package org.example.pocztabackend.dto;

import java.util.UUID;

public record OpsCourierSummaryResponse(
        UUID courierId,
        String courierEmail,
        String displayName,
        String inferredServiceCity,
        long openTaskCount,
        long inProgressTaskCount,
        long failedTaskCount,
        boolean availableForAutoAssignment
) {
}
