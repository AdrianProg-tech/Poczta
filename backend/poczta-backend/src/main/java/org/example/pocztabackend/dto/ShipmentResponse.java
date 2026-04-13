package org.example.pocztabackend.dto;

import org.example.pocztabackend.model.Shipment;
import org.example.pocztabackend.model.enums.ShipmentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record ShipmentResponse(
        UUID id,
        String trackingNumber,
        ShipmentStatus status,
        String senderName,
        String senderPhone,
        String recipientName,
        String recipientPhone,
        String deliveryType,
        BigDecimal weight,
        String sizeCategory,
        LocalDateTime createdAt
) {
    public static ShipmentResponse fromEntity(Shipment shipment) {
        return new ShipmentResponse(
                shipment.getId(),
                shipment.getTrackingNumber(),
                shipment.getStatus(),
                shipment.getSenderName(),
                shipment.getSenderPhone(),
                shipment.getRecipientName(),
                shipment.getRecipientPhone(),
                shipment.getDeliveryType(),
                shipment.getWeight(),
                shipment.getSizeCategory(),
                shipment.getCreatedAt()
        );
    }
}
