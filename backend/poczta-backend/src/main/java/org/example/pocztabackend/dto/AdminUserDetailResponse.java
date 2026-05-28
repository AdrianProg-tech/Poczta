package org.example.pocztabackend.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record AdminUserDetailResponse(
        UUID userId,
        String firstName,
        String lastName,
        String email,
        String phone,
        boolean active,
        List<String> roles,
        String serviceCity,
        String pointCode,
        String pointName,
        LocalDateTime createdAt
) {}
