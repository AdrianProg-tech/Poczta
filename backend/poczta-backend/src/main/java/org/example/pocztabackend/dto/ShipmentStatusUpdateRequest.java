package org.example.pocztabackend.dto;

import org.example.pocztabackend.model.enums.ShipmentStatus;

public record ShipmentStatusUpdateRequest(ShipmentStatus status) {
}
