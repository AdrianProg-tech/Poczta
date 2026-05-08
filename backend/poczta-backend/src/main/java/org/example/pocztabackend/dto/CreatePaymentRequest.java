package org.example.pocztabackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CreatePaymentRequest(
        @NotBlank(message = "method is required")
        String method,
        @NotNull(message = "amount is required")
        BigDecimal amount
) {
}
