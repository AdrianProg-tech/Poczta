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
        String routeStatus,
        String senderName,
        String senderPhone,
        String recipientName,
        String recipientPhone,
        String deliveryType,
        String intakeMethod,
        String deliveryMethod,
        String sourcePointCode,
        String targetPointCode,
        String currentNodeType,
        String currentNodeCode,
        BigDecimal weight,
        String sizeCategory,
        LocalDateTime createdAt
) {
    public static ShipmentResponse fromEntity(Shipment shipment) {
        return new ShipmentResponse(
                shipment.getId(),
                shipment.getTrackingNumber(),
                shipment.getStatus(),
                shipment.getShipmentRouteStatus(),
                shipment.getSenderName(),
                shipment.getSenderPhone(),
                shipment.getRecipientName(),
                shipment.getRecipientPhone(),
                shipment.getDeliveryType(),
                shipment.getIntakeMethod(),
                shipment.getDeliveryMethod(),
                shipment.getSourcePoint() == null ? null : shipment.getSourcePoint().getPointCode(),
                shipment.getTargetPoint() == null ? null : shipment.getTargetPoint().getPointCode(),
                shipment.getCurrentNodeType(),
                shipment.getCurrentNodeCode(),
                shipment.getWeight(),
                shipment.getSizeCategory(),
                shipment.getCreatedAt()
        );
    }
}
