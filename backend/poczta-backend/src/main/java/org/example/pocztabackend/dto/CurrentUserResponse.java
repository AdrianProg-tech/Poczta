package org.example.pocztabackend.dto;

import org.example.pocztabackend.model.Role;
import org.example.pocztabackend.model.User;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

public record CurrentUserResponse(
        UUID id,
        String email,
        String displayName,
        List<String> roles,
        String pointCode
) {
    public static CurrentUserResponse fromEntity(User user) {
        List<String> roleNames = user.getRoles() == null
                ? List.of()
                : user.getRoles().stream()
                .map(Role::getName)
                .sorted(Comparator.naturalOrder())
                .toList();

        String firstName = user.getFirstName() == null ? "" : user.getFirstName().trim();
        String lastName = user.getLastName() == null ? "" : user.getLastName().trim();
        String displayName = (firstName + " " + lastName).trim();
        if (displayName.isBlank()) {
            displayName = user.getEmail();
        }

        return new CurrentUserResponse(
                user.getId(),
                user.getEmail(),
                displayName,
                roleNames,
                null
        );
    }
}
