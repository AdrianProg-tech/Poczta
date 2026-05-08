package org.example.pocztabackend.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateShipmentRecipientRequest(
        @NotBlank(message = "recipient.name is required")
        String name,
        @NotBlank(message = "recipient.phone is required")
        String phone,
        @NotBlank(message = "recipient.address is required")
        String address
) {
}
