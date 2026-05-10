package org.example.pocztabackend.dto;

import java.util.UUID;

public record PointCheckoutResponse(
        String trackingNumber,
        UUID paymentId,
        String paymentStatus,
        String shipmentStatus
) {
}
