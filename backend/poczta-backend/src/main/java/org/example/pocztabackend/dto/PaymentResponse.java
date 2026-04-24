package org.example.pocztabackend.dto;

import org.example.pocztabackend.model.Payment;
import org.example.pocztabackend.model.enums.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record PaymentResponse(
        UUID id,
        UUID shipmentId,
        BigDecimal amount,
        String method,
        PaymentStatus status,
        String externalReference,
        LocalDateTime createdAt
) {
    public static PaymentResponse fromEntity(Payment payment) {
        return new PaymentResponse(
                payment.getId(),
                payment.getShipment() != null ? payment.getShipment().getId() : null,
                payment.getAmount(),
                payment.getMethod(),
                payment.getStatus(),
                payment.getExternalReference(),
                payment.getCreatedAt()
        );
    }
}
