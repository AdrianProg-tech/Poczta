package org.example.pocztabackend.dto;

import java.math.BigDecimal;

public record ShipmentParcelResponse(
        BigDecimal weight,
        String sizeCategory,
        BigDecimal declaredValue,
        Boolean fragile
) {
}
