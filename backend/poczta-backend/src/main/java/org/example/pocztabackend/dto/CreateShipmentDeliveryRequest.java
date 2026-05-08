package org.example.pocztabackend.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateShipmentDeliveryRequest(
        @NotBlank(message = "deliveryType is required")
        String deliveryType,
        String targetPointCode
) {
}
