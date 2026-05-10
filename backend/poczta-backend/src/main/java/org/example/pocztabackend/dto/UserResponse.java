package org.example.pocztabackend.dto;

import org.example.pocztabackend.model.User;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String firstName,
        String lastName,
        String email,
        String phone,
        boolean isActive,
        LocalDateTime createdAt,
        List<String> roles
) {
    public static UserResponse fromEntity(User user) {
        return new UserResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getPhone(),
                user.isActive(),
                user.getCreatedAt(),
                user.getRoles() == null ? List.of() : user.getRoles().stream()
                        .map(role -> role.getName())
                        .sorted(Comparator.naturalOrder())
                        .toList()
        );
    }
}
