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
        String legacyShipmentStatus,
        String recipientName,
        String recipientPhone,
        String targetAddress,
        String currentNodeType,
        String currentNodeCode,
        LocalDate plannedDate,
        String paymentStatus,
        String paymentMethod,
        BigDecimal paymentAmount,
        String paymentCollectionMethod,
        boolean requiresPaymentCollection
) {
    public static CourierTaskListItemResponse fromEntity(
            CourierTask task,
            Payment latestPayment,
            String shipmentStatus,
            String currentNodeType,
            String currentNodeCode
    ) {
        String taskType = task.getTaskType() == null || task.getTaskType().isBlank()
                ? "DELIVERY"
                : task.getTaskType().trim().toUpperCase();
        String legacyShipmentStatus = task.getShipment() == null || task.getShipment().getStatus() == null
                ? null
                : task.getShipment().getStatus().name();
        String paymentMethod = latestPayment == null ? null : latestPayment.getMethod();
        String paymentStatus = latestPayment == null || latestPayment.getStatus() == null
                ? null
                : latestPayment.getStatus().name();
        boolean requiresPaymentCollection = latestPayment != null
                && latestPayment.getStatus() == PaymentStatus.OFFLINE_PENDING
                && "DELIVERY".equals(taskType)
                && "OFFLINE_AT_COURIER".equalsIgnoreCase(paymentMethod);
        String contactName = task.getShipment() == null
                ? null
                : "PICKUP".equals(taskType) ? task.getShipment().getSenderName() : task.getShipment().getRecipientName();
        String contactPhone = task.getShipment() == null
                ? null
                : "PICKUP".equals(taskType) ? task.getShipment().getSenderPhone() : task.getShipment().getRecipientPhone();
        String targetAddress = task.getShipment() == null
                ? null
                : "PICKUP".equals(taskType) ? task.getShipment().getSenderAddress() : task.getShipment().getRecipientAddress();

        return new CourierTaskListItemResponse(
                task.getId(),
                task.getShipment() == null ? null : task.getShipment().getTrackingNumber(),
                taskType,
                task.getStatus(),
                shipmentStatus,
                legacyShipmentStatus,
                contactName,
                contactPhone,
                targetAddress,
                currentNodeType,
                currentNodeCode,
                task.getTaskDate(),
                paymentStatus,
                paymentMethod,
                latestPayment == null ? null : latestPayment.getAmount(),
                latestPayment == null ? null : latestPayment.getCollectionMethod(),
                requiresPaymentCollection
        );
    }
}
