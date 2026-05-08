package org.example.pocztabackend.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateComplaintRequest(
        @NotBlank(message = "trackingNumber is required")
        String trackingNumber,
        @NotBlank(message = "type is required")
        String type,
        String subject,
        @NotBlank(message = "description is required")
        String description
) {
}
