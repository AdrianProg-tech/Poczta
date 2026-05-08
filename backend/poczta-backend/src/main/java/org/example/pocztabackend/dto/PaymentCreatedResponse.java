package org.example.pocztabackend.dto;

import java.util.UUID;

public record PaymentCreatedResponse(
        UUID paymentId,
        String status,
        String method,
        String externalReference
) {
}
