package org.example.pocztabackend.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateShipmentDeliveryRequest(
        String deliveryType,
        @NotBlank(message = "intakeMethod is required")
        String intakeMethod,
        @NotBlank(message = "deliveryMethod is required")
        String deliveryMethod,
        String sourcePointCode,
        String targetPointCode
) {
}
