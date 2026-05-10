package org.example.pocztabackend.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record AdminUserSummaryResponse(
        UUID userId,
        String displayName,
        String email,
        boolean active,
        List<String> roles,
        String serviceCity,
        String pointCode,
        String pointName,
        LocalDateTime createdAt
) {
}
