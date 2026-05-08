package org.example.pocztabackend.dto;

import org.example.pocztabackend.model.TrackingEvent;

import java.time.LocalDateTime;

public record TrackingHistoryItemResponse(
        String status,
        String locationName,
        String description,
        LocalDateTime eventTime
) {
    public static TrackingHistoryItemResponse fromEntity(TrackingEvent event) {
        return new TrackingHistoryItemResponse(
                event.getStatus(),
                event.getLocationName(),
                event.getDescription(),
                event.getEventTime()
        );
    }
}
