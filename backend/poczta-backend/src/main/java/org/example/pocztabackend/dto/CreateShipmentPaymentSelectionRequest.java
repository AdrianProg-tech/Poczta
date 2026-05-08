package org.example.pocztabackend.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateShipmentPaymentSelectionRequest(
        @NotBlank(message = "payment.method is required")
        String method
) {
}
