package org.example.pocztabackend.dto;

import org.example.pocztabackend.model.TrackingEvent;
import java.time.LocalDateTime;
import java.util.UUID;

public record TrackingEventResponse(
        UUID id,
        String status,
        String locationName,
        String description,
        LocalDateTime eventTime
) {
    public static TrackingEventResponse fromEntity(TrackingEvent event) {
        return new TrackingEventResponse(
                event.getId(),
                event.getStatus(),
                event.getLocationName(),
                event.getDescription(),
                event.getEventTime()
        );
    }
}