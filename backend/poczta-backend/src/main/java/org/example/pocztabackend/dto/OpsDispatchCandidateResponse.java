package org.example.pocztabackend.dto;

import java.util.UUID;

public record OpsDispatchCandidateResponse(
        UUID shipmentId,
        String trackingNumber,
        String destinationCity,
        String shipmentStatus,
        UUID suggestedCourierId,
        String suggestedCourierEmail,
        String suggestionReason
) {
}
