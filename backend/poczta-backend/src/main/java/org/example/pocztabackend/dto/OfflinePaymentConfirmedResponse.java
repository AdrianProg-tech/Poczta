package org.example.pocztabackend.dto;

import java.util.UUID;

public record OfflinePaymentConfirmedResponse(
        UUID paymentId,
        String paymentStatus,
        String shipmentStatus
) {
}
