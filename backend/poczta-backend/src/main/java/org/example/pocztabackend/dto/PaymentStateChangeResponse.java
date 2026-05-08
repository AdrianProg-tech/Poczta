package org.example.pocztabackend.dto;

import java.util.UUID;

public record PaymentStateChangeResponse(
        UUID paymentId,
        String paymentStatus,
        String shipmentStatus
) {
}
