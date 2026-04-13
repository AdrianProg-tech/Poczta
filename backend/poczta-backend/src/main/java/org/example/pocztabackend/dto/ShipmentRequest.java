package org.example.pocztabackend.dto;

import org.example.pocztabackend.model.enums.ShipmentStatus;

import java.math.BigDecimal;

public record ShipmentRequest(
        String trackingNumber,
        ShipmentStatus status,
        String senderName,
        String senderPhone,
        String recipientName,
        String recipientPhone,
        String deliveryType,
        BigDecimal weight,
        String sizeCategory
) {
}
