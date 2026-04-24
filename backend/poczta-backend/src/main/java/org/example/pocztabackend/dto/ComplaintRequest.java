package org.example.pocztabackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ComplaintRequest(
        @NotNull(message = "shipmentId is required")
        UUID shipmentId,
        @NotNull(message = "userId is required")
        UUID userId,
        @NotBlank(message = "type is required")
        String type,
        String description
) {
}
