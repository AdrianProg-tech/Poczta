package org.example.pocztabackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.example.pocztabackend.model.enums.ShipmentStatus;

import java.util.UUID;

public record TrackingEventRequest(
        @NotNull(message = "shipmentId is required")
        UUID shipmentId,
        @NotNull(message = "status is required")
        ShipmentStatus status,
        @NotBlank(message = "locationName is required")
        String locationName,
        @NotBlank(message = "description is required")
        String description
) {
}
