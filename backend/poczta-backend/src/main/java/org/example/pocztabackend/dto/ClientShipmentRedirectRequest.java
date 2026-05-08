package org.example.pocztabackend.dto;

import jakarta.validation.constraints.NotBlank;

public record ClientShipmentRedirectRequest(
        @NotBlank(message = "targetPointCode is required")
        String targetPointCode,
        String reason
) {
}
