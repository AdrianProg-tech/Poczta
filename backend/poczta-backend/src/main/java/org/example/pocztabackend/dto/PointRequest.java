package org.example.pocztabackend.dto;

public record PointRequest(
        String name,
        String type,
        String city,
        String address,
        String postalCode,
        Boolean active
) {
}
