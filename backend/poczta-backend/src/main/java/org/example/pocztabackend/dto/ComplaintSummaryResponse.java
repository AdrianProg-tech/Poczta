package org.example.pocztabackend.dto;

import org.example.pocztabackend.model.Complaint;

import java.time.LocalDateTime;
import java.util.UUID;

public record ComplaintSummaryResponse(
        UUID complaintId,
        String complaintNumber,
        String trackingNumber,
        String type,
        String subject,
        String status,
        LocalDateTime submittedAt
) {
    public static ComplaintSummaryResponse fromEntity(Complaint complaint) {
        return new ComplaintSummaryResponse(
                complaint.getId(),
                complaint.getComplaintNumber(),
                complaint.getShipment() == null ? null : complaint.getShipment().getTrackingNumber(),
                complaint.getType(),
                null,
                complaint.getStatus() == null ? null : complaint.getStatus().name(),
                complaint.getSubmittedAt()
        );
    }
}
