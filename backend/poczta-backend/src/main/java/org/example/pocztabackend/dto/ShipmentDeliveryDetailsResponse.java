package org.example.pocztabackend.dto;

import java.time.LocalDate;

public record ShipmentDeliveryDetailsResponse(
        String deliveryType,
        String currentPointCode,
        String targetPointCode,
        LocalDate estimatedDeliveryDate
) {
}
