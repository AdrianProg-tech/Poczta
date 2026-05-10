package org.example.pocztabackend.dto;

import java.util.UUID;

public record OpsReassignmentCandidateResponse(
        UUID shipmentId,
        UUID currentTaskId,
        String trackingNumber,
        String destinationCity,
        String shipmentStatus,
        String currentCourierEmail,
        String currentTaskStatus,
        UUID suggestedCourierId,
        String suggestedCourierEmail,
        String suggestionReason
) {
}
