package org.example.pocztabackend.dto;

import java.util.UUID;

public record PointToggleActiveResponse(
        UUID pointId,
        String pointCode,
        String name,
        boolean active
) {}
