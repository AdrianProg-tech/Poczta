package org.example.pocztabackend.dto;

import org.example.pocztabackend.model.CourierTask;

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
        LocalDate plannedDate
) {
    public static CourierTaskListItemResponse fromEntity(CourierTask task) {
        String shipmentStatus = task.getShipment() == null || task.getShipment().getStatus() == null
                ? null
                : task.getShipment().getStatus().name();

        return new CourierTaskListItemResponse(
                task.getId(),
                task.getShipment() == null ? null : task.getShipment().getTrackingNumber(),
                "DELIVERY",
                task.getStatus(),
                shipmentStatus,
                task.getShipment() == null ? null : task.getShipment().getRecipientName(),
                task.getShipment() == null ? null : task.getShipment().getRecipientPhone(),
                task.getShipment() == null ? null : task.getShipment().getRecipientAddress(),
                task.getTaskDate()
        );
    }
}
