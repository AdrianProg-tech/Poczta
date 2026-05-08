package org.example.pocztabackend.dto;

import org.example.pocztabackend.model.Point;
import org.example.pocztabackend.model.Shipment;
import org.example.pocztabackend.model.enums.PaymentStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record ClientShipmentListItemResponse(
        String trackingNumber,
        String currentStatus,
        String paymentStatus,
        String recipientName,
        String destinationSummary,
        LocalDateTime createdAt,
        LocalDate estimatedDeliveryDate
) {
    public static ClientShipmentListItemResponse from(Shipment shipment, PaymentStatus latestPaymentStatus) {
        return new ClientShipmentListItemResponse(
                shipment.getTrackingNumber(),
                shipment.getStatus() == null ? null : shipment.getStatus().name(),
                latestPaymentStatus == null ? null : latestPaymentStatus.name(),
                shipment.getRecipientName(),
                resolveDestinationSummary(shipment),
                shipment.getCreatedAt(),
                shipment.getEstimatedDeliveryDate()
        );
    }

    private static String resolveDestinationSummary(Shipment shipment) {
        Point destinationPoint = shipment.getTargetPoint() != null ? shipment.getTargetPoint() : shipment.getCurrentPoint();
        if (destinationPoint != null) {
            return String.join(", ",
                    java.util.stream.Stream.of(destinationPoint.getPointCode(), destinationPoint.getCity(), destinationPoint.getAddress())
                            .filter(value -> value != null && !value.isBlank())
                            .toList()
            );
        }
        return shipment.getRecipientAddress();
    }
}
