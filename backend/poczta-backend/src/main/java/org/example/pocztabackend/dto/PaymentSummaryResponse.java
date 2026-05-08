package org.example.pocztabackend.dto;

import org.example.pocztabackend.model.Payment;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record PaymentSummaryResponse(
        UUID paymentId,
        String trackingNumber,
        BigDecimal amount,
        String method,
        String status,
        String externalReference,
        LocalDateTime createdAt
) {
    public static PaymentSummaryResponse fromEntity(Payment payment) {
        return new PaymentSummaryResponse(
                payment.getId(),
                payment.getShipment() == null ? null : payment.getShipment().getTrackingNumber(),
                payment.getAmount(),
                payment.getMethod(),
                payment.getStatus() == null ? null : payment.getStatus().name(),
                payment.getExternalReference(),
                payment.getCreatedAt()
        );
    }
}
