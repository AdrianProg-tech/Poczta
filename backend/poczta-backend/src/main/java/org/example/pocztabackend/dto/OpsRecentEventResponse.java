package org.example.pocztabackend.dto;

import java.time.LocalDateTime;

public record OpsRecentEventResponse(
        String trackingNumber,
        String status,
        String locationName,
        String description,
        LocalDateTime eventTime
) {
}
