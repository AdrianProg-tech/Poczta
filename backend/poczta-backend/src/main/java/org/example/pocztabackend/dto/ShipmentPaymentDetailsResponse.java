package org.example.pocztabackend.dto;

import java.math.BigDecimal;

public record ShipmentPaymentDetailsResponse(
        String status,
        String method,
        BigDecimal amount,
        String externalReference
) {
}
