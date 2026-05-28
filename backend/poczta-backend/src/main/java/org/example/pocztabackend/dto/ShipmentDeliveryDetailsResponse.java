package org.example.pocztabackend.dto;

import java.time.LocalDate;

public record ShipmentDeliveryDetailsResponse(
        String deliveryType,
        String intakeMethod,
        String deliveryMethod,
        String shipmentRouteStatus,
        String currentNodeType,
        String currentNodeCode,
        String sourcePointCode,
        String currentPointCode,
        String targetPointCode,
        LocalDate estimatedDeliveryDate
) {
}
