package org.example.pocztabackend.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import org.example.pocztabackend.model.enums.ShipmentStatus;

import java.util.List;
import java.util.UUID;

public record BulkStatusUpdateRequest (
    // nie damy kurierowi możliwości wysłania pustej listy
    @NotEmpty(message = "shipmentIds list cannot be empty")
    List<UUID> shipmentIds,
    @NotNull(message = "status is required")
    ShipmentStatus status
){
}
