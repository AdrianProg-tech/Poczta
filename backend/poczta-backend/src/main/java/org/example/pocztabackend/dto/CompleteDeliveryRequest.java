package org.example.pocztabackend.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record CompleteDeliveryRequest(
        @NotNull(message = "deliveredAt is required")
        LocalDateTime deliveredAt,
        String note
) {
}
