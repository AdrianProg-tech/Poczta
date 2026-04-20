package org.example.pocztabackend.dto;

import org.example.pocztabackend.model.Complaint;
import org.example.pocztabackend.model.enums.ComplaintStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record ComplaintResponse(
        UUID id,
        String complaintNumber,
        String type,
        ComplaintStatus status,
        String description,
        LocalDateTime submittedAt
) {
    public static ComplaintResponse fromEntity(Complaint complaint) {
        return new ComplaintResponse(
                complaint.getId(),
                complaint.getComplaintNumber(),
                complaint.getType(),
                complaint.getStatus(),
                complaint.getDescription(),
                complaint.getSubmittedAt()
        );
    }
}