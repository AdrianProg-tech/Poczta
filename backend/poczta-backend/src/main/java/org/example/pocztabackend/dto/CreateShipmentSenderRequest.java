package org.example.pocztabackend.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateShipmentSenderRequest(
        @NotBlank(message = "sender.name is required")
        String name,
        @NotBlank(message = "sender.phone is required")
        String phone,
        @NotBlank(message = "sender.address is required")
        String address
) {
}
