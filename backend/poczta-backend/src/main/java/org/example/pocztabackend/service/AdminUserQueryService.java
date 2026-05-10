package org.example.pocztabackend.service;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import org.example.pocztabackend.dto.AdminUserSummaryResponse;
import org.example.pocztabackend.model.CourierProfile;
import org.example.pocztabackend.model.PointStaffAssignment;
import org.example.pocztabackend.model.Role;
import org.example.pocztabackend.model.User;
import org.example.pocztabackend.repository.CourierProfileRepository;
import org.example.pocztabackend.repository.PointStaffAssignmentRepository;
import org.example.pocztabackend.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class AdminUserQueryService {

    private final UserRepository userRepository;
    private final CourierProfileRepository courierProfileRepository;
    private final PointStaffAssignmentRepository pointStaffAssignmentRepository;

    public AdminUserQueryService(
            UserRepository userRepository,
            CourierProfileRepository courierProfileRepository,
            PointStaffAssignmentRepository pointStaffAssignmentRepository
    ) {
        this.userRepository = userRepository;
        this.courierProfileRepository = courierProfileRepository;
        this.pointStaffAssignmentRepository = pointStaffAssignmentRepository;
    }

    public List<AdminUserSummaryResponse> getAdminUsers() {
        return userRepository.findAll().stream()
                .sorted(Comparator
                        .comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(User::getEmail, Comparator.nullsLast(String::compareToIgnoreCase)))
                .map(this::toSummary)
                .toList();
    }

    private AdminUserSummaryResponse toSummary(User user) {
        CourierProfile courierProfile = courierProfileRepository.findByUser_Id(user.getId()).orElse(null);
        PointStaffAssignment pointAssignment = pointStaffAssignmentRepository
                .findFirstByUser_IdAndActiveTrueOrderByPrimaryAssignmentDescIdAsc(user.getId())
                .orElse(null);

        return new AdminUserSummaryResponse(
                user.getId(),
                buildDisplayName(user),
                user.getEmail(),
                user.isActive(),
                user.getRoles() == null ? List.of() : user.getRoles().stream()
                        .map(Role::getName)
                        .map(this::toAppRole)
                        .filter(role -> role != null && !role.isBlank())
                        .distinct()
                        .sorted(String::compareToIgnoreCase)
                        .toList(),
                courierProfile == null ? null : courierProfile.getServiceCity(),
                pointAssignment == null || pointAssignment.getPoint() == null ? null : pointAssignment.getPoint().getPointCode(),
                pointAssignment == null || pointAssignment.getPoint() == null ? null : pointAssignment.getPoint().getName(),
                user.getCreatedAt()
        );
    }

    private String buildDisplayName(User user) {
        String firstName = user.getFirstName() == null ? "" : user.getFirstName().trim();
        String lastName = user.getLastName() == null ? "" : user.getLastName().trim();
        String displayName = (firstName + " " + lastName).trim();
        return displayName.isBlank() ? user.getEmail() : displayName;
    }

    private String toAppRole(String rawRole) {
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
