package org.example.pocztabackend.dto;

import jakarta.validation.constraints.NotBlank;

public record RecordDeliveryAttemptRequest(
        @NotBlank(message = "result is required")
        String result,
        String note,
        Boolean redirectToPickup,
        String redirectPointCode
) {
}
