package org.example.pocztabackend.dto;

import jakarta.validation.constraints.NotNull;
import org.example.pocztabackend.model.enums.ShipmentStatus;

public record ShipmentStatusUpdateRequest(
        @NotNull(message = "status is required")
        ShipmentStatus status
) {
}
