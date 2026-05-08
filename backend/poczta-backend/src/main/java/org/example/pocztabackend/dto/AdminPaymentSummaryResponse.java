package org.example.pocztabackend.dto;

import org.example.pocztabackend.model.Payment;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record AdminPaymentSummaryResponse(
        UUID paymentId,
        String trackingNumber,
        BigDecimal amount,
        String method,
        String status,
        String externalReference,
        String clientEmail,
        LocalDateTime createdAt
) {
    public static AdminPaymentSummaryResponse fromEntity(Payment payment) {
        return new AdminPaymentSummaryResponse(
                payment.getId(),
                payment.getShipment() == null ? null : payment.getShipment().getTrackingNumber(),
                payment.getAmount(),
                payment.getMethod(),
                payment.getStatus() == null ? null : payment.getStatus().name(),
                payment.getExternalReference(),
                payment.getShipment() == null || payment.getShipment().getCreator() == null
                        ? null
                        : payment.getShipment().getCreator().getEmail(),
                payment.getCreatedAt()
        );
    }
}
