package org.example.pocztabackend.dto;

import org.example.pocztabackend.model.Point;

import java.util.UUID;

public record PointResponse(
        UUID id,
        String pointCode,
        String name,
        String type,
        String city,
        String address,
        String postalCode,
        String phone,
        String openingHours,
        boolean active
) {
    public static PointResponse fromEntity(Point point) {
        return new PointResponse(
                point.getId(),
                point.getPointCode(),
                point.getName(),
                point.getType(),
                point.getCity(),
                point.getAddress(),
                point.getPostalCode(),
                point.getPhone(),
                point.getOpeningHours(),
                point.isActive()
        );
    }
}
