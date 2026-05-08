package org.example.pocztabackend.dto;

import java.util.UUID;

public record ClientShipmentRedirectResponse(
        String trackingNumber,
        String shipmentStatus,
        String targetPointCode,
        UUID redirectionId,
        String redirectionStatus
) {
}
