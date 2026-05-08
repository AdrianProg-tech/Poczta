package org.example.pocztabackend.dto;

import org.example.pocztabackend.model.Complaint;

import java.time.LocalDateTime;
import java.util.UUID;

public record AdminComplaintSummaryResponse(
        UUID complaintId,
        String complaintNumber,
        String trackingNumber,
        String clientEmail,
        String type,
        String status,
        String resolutionNote,
        LocalDateTime submittedAt
) {
    public static AdminComplaintSummaryResponse fromEntity(Complaint complaint) {
        return new AdminComplaintSummaryResponse(
                complaint.getId(),
                complaint.getComplaintNumber(),
                complaint.getShipment() == null ? null : complaint.getShipment().getTrackingNumber(),
                complaint.getUser() == null ? null : complaint.getUser().getEmail(),
                complaint.getType(),
                complaint.getStatus() == null ? null : complaint.getStatus().name(),
                complaint.getResolutionNote(),
                complaint.getSubmittedAt()
        );
    }
}
