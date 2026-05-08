package org.example.pocztabackend.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record AdminAssignCourierRequest(
        @NotNull(message = "courierId is required")
        UUID courierId,
        @NotNull(message = "taskDate is required")
        LocalDate taskDate
) {
}
