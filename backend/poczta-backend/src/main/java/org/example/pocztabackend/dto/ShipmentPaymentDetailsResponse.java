package org.example.pocztabackend.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record ShipmentPaymentDetailsResponse(
        UUID paymentId,
        String status,
        String method,
        BigDecimal amount,
        String collectionMethod,
        String externalReference
) {
}
