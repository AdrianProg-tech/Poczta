package org.example.pocztabackend.dto;

import java.util.UUID;

public record UserToggleActiveResponse(
        UUID userId,
        String email,
        boolean active
) {}
