package org.example.pocztabackend.dto;

public record AdminPointUpdateRequest(
        String name,
        String address,
        String city,
        String postalCode,
        String phone,
        String openingHours
) {}
