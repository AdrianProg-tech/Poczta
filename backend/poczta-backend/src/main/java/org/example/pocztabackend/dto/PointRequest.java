package org.example.pocztabackend.dto;

import jakarta.validation.constraints.NotBlank;

public record PointRequest(
        @NotBlank(message = "name is required")
        String name,
        @NotBlank(message = "type is required")
        String type,
        String city,
        String address,
        String postalCode,
        Boolean active
) {
}
