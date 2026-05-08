package org.example.pocztabackend.dto;

import java.util.UUID;

public record ComplaintStateChangeResponse(
        UUID complaintId,
        String complaintNumber,
        String status,
        String resolutionNote
) {
}
