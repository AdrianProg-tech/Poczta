package org.example.pocztabackend.dto;

import org.example.pocztabackend.model.Point;

public record PublicPointResponse(
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
    public static PublicPointResponse fromEntity(Point point) {
        return new PublicPointResponse(
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
