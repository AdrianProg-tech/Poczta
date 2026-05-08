package org.example.pocztabackend.dto;

import java.util.UUID;

public record ComplaintCreatedResponse(
        UUID complaintId,
        String complaintNumber,
        String status
) {
}
