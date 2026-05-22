package org.example.pocztabackend.dto;

import org.example.pocztabackend.model.CourierTask;
import org.example.pocztabackend.model.Payment;
import org.example.pocztabackend.model.enums.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CourierTaskListItemResponse(
        UUID taskId,
        String trackingNumber,
        String taskType,
        String taskStatus,
        String shipmentStatus,
        String recipientName,
        String recipientPhone,
        String targetAddress,
        LocalDate plannedDate,
        String paymentStatus,
        String paymentMethod,
        BigDecimal paymentAmount,
        String paymentCollectionMethod,
        boolean requiresPaymentCollection
) {
    public static CourierTaskListItemResponse fromEntity(CourierTask task, Payment latestPayment) {
        String shipmentStatus = task.getShipment() == null || task.getShipment().getStatus() == null
                ? null
                : task.getShipment().getStatus().name();
        String paymentMethod = latestPayment == null ? null : latestPayment.getMethod();
        String paymentStatus = latestPayment == null || latestPayment.getStatus() == null
                ? null
                : latestPayment.getStatus().name();
        boolean requiresPaymentCollection = latestPayment != null
                && latestPayment.getStatus() == PaymentStatus.OFFLINE_PENDING
                && "OFFLINE_AT_COURIER".equalsIgnoreCase(paymentMethod);

        return new CourierTaskListItemResponse(
                task.getId(),
                task.getShipment() == null ? null : task.getShipment().getTrackingNumber(),
                "DELIVERY",
                task.getStatus(),
                shipmentStatus,
                task.getShipment() == null ? null : task.getShipment().getRecipientName(),
                task.getShipment() == null ? null : task.getShipment().getRecipientPhone(),
                task.getShipment() == null ? null : task.getShipment().getRecipientAddress(),
                task.getTaskDate(),
                paymentStatus,
                paymentMethod,
                latestPayment == null ? null : latestPayment.getAmount(),
                latestPayment == null ? null : latestPayment.getCollectionMethod(),
                requiresPaymentCollection
        );
    }
}
