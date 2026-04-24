package org.example.pocztabackend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.example.pocztabackend.model.enums.ShipmentStatus;

import java.math.BigDecimal;

public record ShipmentRequest(
        @NotBlank(message = "trackingNumber is required")
        String trackingNumber,
        @NotNull(message = "status is required")
        ShipmentStatus status,
        @NotBlank(message = "senderName is required")
        String senderName,
        @NotBlank(message = "senderPhone is required")
        String senderPhone,
        @NotBlank(message = "recipientName is required")
        String recipientName,
        @NotBlank(message = "recipientPhone is required")
        String recipientPhone,
        @NotBlank(message = "deliveryType is required")
        String deliveryType,
        @NotNull(message = "weight is required")
        @DecimalMin(value = "0.01", message = "weight must be greater than zero")
        BigDecimal weight,
        @NotBlank(message = "sizeCategory is required")
        String sizeCategory
) {
}
