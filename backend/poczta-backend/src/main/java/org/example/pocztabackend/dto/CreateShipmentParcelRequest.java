package org.example.pocztabackend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CreateShipmentParcelRequest(
        @NotNull(message = "parcel.weight is required")
        @DecimalMin(value = "0.01", message = "parcel.weight must be greater than zero")
        BigDecimal weight,
        @NotBlank(message = "parcel.sizeCategory is required")
        String sizeCategory,
        BigDecimal declaredValue,
        String contents,
        Boolean fragile
) {
}
