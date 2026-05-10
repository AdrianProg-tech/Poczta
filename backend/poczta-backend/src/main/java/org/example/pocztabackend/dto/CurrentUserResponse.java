package org.example.pocztabackend.dto;

import org.example.pocztabackend.model.CourierProfile;
import org.example.pocztabackend.model.PointStaffAssignment;
import org.example.pocztabackend.model.Role;
import org.example.pocztabackend.model.User;
import org.example.pocztabackend.service.RoleCatalog;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

public record CurrentUserResponse(
        UUID id,
        String email,
        String displayName,
        List<String> roles,
        String adminScope,
        String pointCode,
        String pointName,
        String serviceCity
) {
    public static CurrentUserResponse fromEntity(User user, CourierProfile courierProfile, PointStaffAssignment pointAssignment) {
        List<String> roleNames = user.getRoles() == null
                ? List.of()
                : user.getRoles().stream()
                .map(Role::getName)
                .map(CurrentUserResponse::toAppRole)
                .filter(name -> name != null && !name.isBlank())
                .distinct()
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
                resolveAdminScope(user),
                pointAssignment == null || pointAssignment.getPoint() == null ? null : pointAssignment.getPoint().getPointCode(),
                pointAssignment == null || pointAssignment.getPoint() == null ? null : pointAssignment.getPoint().getName(),
                courierProfile == null ? null : courierProfile.getServiceCity()
        );
    }

    private static String resolveAdminScope(User user) {
        if (user == null || user.getRoles() == null) {
            return null;
        }

        List<String> rawRoles = user.getRoles().stream()
                .map(Role::getName)
                .filter(name -> name != null && !name.isBlank())
                .map(name -> name.trim().toUpperCase(Locale.ROOT))
                .toList();

        if (rawRoles.contains(RoleCatalog.ADMIN)) {
            return "ADMIN";
        }
        if (rawRoles.contains(RoleCatalog.DISPATCHER)) {
            return "DISPATCHER";
        }
        return null;
    }

    private static String toAppRole(String rawRole) {
        if (rawRole == null || rawRole.isBlank()) {
            return null;
        }

        return switch (rawRole.trim().toUpperCase(Locale.ROOT)) {
            case RoleCatalog.CLIENT -> "client";
            case RoleCatalog.COURIER -> "courier";
            case RoleCatalog.POINT_WORKER -> "point";
            case RoleCatalog.ADMIN, RoleCatalog.DISPATCHER -> "admin";
            default -> null;
        };
    }
}
