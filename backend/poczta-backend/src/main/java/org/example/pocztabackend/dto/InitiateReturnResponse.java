package org.example.pocztabackend.dto;

import java.util.UUID;

public record InitiateReturnResponse(
        UUID returnProcessId,
        String returnStatus,
        String trackingNumber,
        String shipmentStatus
) {
}
