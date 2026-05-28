package org.example.pocztabackend.service;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.example.pocztabackend.dto.AdminUserDetailResponse;
import org.example.pocztabackend.dto.AdminUserSummaryResponse;
import org.example.pocztabackend.dto.AdminUserUpdateRequest;
import org.example.pocztabackend.dto.UserToggleActiveResponse;
import org.example.pocztabackend.model.CourierProfile;
import org.example.pocztabackend.model.Point;
import org.example.pocztabackend.model.PointStaffAssignment;
import org.example.pocztabackend.model.Role;
import org.example.pocztabackend.model.User;
import org.example.pocztabackend.repository.CourierProfileRepository;
import org.example.pocztabackend.repository.PointRepository;
import org.example.pocztabackend.repository.PointStaffAssignmentRepository;
import org.example.pocztabackend.repository.RoleRepository;
import org.example.pocztabackend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminUserQueryService {

    private final UserRepository userRepository;
    private final CourierProfileRepository courierProfileRepository;
    private final PointStaffAssignmentRepository pointStaffAssignmentRepository;
    private final RoleRepository roleRepository;
    private final PointRepository pointRepository;

    public AdminUserQueryService(
            UserRepository userRepository,
            CourierProfileRepository courierProfileRepository,
            PointStaffAssignmentRepository pointStaffAssignmentRepository,
            RoleRepository roleRepository,
            PointRepository pointRepository
    ) {
        this.userRepository = userRepository;
        this.courierProfileRepository = courierProfileRepository;
        this.pointStaffAssignmentRepository = pointStaffAssignmentRepository;
        this.roleRepository = roleRepository;
        this.pointRepository = pointRepository;
    }

    public List<AdminUserSummaryResponse> getAdminUsers() {
        return userRepository.findAll().stream()
                .sorted(Comparator
                        .comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(User::getEmail, Comparator.nullsLast(String::compareToIgnoreCase)))
                .map(this::toSummary)
                .toList();
    }

    @Transactional
    public UserToggleActiveResponse toggleActive(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setActive(!user.isActive());
        userRepository.save(user);
        return new UserToggleActiveResponse(user.getId(), user.getEmail(), user.isActive());
    }

    public AdminUserDetailResponse getUserDetail(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return toDetail(user);
    }

    @Transactional
    public AdminUserDetailResponse updateUser(UUID userId, AdminUserUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (request.firstName() != null) user.setFirstName(request.firstName().trim());
        if (request.lastName() != null) user.setLastName(request.lastName().trim());
        if (request.phone() != null) user.setPhone(request.phone().trim());

        if (request.roles() != null) {
            Set<Role> newRoles = new HashSet<>();
            for (String appRole : request.roles()) {
                String systemRoleName = toSystemRole(appRole);
                if (systemRoleName != null) {
                    roleRepository.findByName(systemRoleName).ifPresent(newRoles::add);
                }
            }
            user.setRoles(newRoles);
        }

        userRepository.save(user);

        // Update or create CourierProfile
        if (request.serviceCity() != null) {
            if (StringUtils.hasText(request.serviceCity())) {
                CourierProfile profile = courierProfileRepository.findByUser_Id(userId).orElseGet(() -> {
                    CourierProfile cp = new CourierProfile();
                    cp.setUser(user);
                    cp.setActive(true);
                    return cp;
                });
                profile.setServiceCity(request.serviceCity().trim());
                courierProfileRepository.save(profile);
            } else {
                courierProfileRepository.findByUser_Id(userId).ifPresent(cp -> {
                    cp.setServiceCity(null);
                    courierProfileRepository.save(cp);
                });
            }
        }

        // Update PointStaffAssignment
        if (request.pointCode() != null) {
            // Deactivate all existing active assignments first
            pointStaffAssignmentRepository.findAllByUser_IdAndActiveTrue(userId)
                    .forEach(a -> {
                        a.setActive(false);
                        pointStaffAssignmentRepository.save(a);
                    });

            if (StringUtils.hasText(request.pointCode())) {
                Point point = pointRepository.findByPointCode(request.pointCode().trim().toUpperCase(Locale.ROOT))
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Point not found: " + request.pointCode()));
                PointStaffAssignment assignment = new PointStaffAssignment();
                assignment.setUser(user);
                assignment.setPoint(point);
                assignment.setActive(true);
                assignment.setPrimaryAssignment(true);
                assignment.setAssignmentRole("POINT_WORKER");
                pointStaffAssignmentRepository.save(assignment);
            }
        }

        return toDetail(user);
    }

    private AdminUserDetailResponse toDetail(User user) {
        CourierProfile courierProfile = courierProfileRepository.findByUser_Id(user.getId()).orElse(null);
        PointStaffAssignment pointAssignment = pointStaffAssignmentRepository
                .findFirstByUser_IdAndActiveTrueOrderByPrimaryAssignmentDescIdAsc(user.getId())
                .orElse(null);

        List<String> appRoles = user.getRoles() == null ? List.of() : user.getRoles().stream()
                .map(Role::getName)
                .map(this::toAppRole)
                .filter(role -> role != null && !role.isBlank())
                .distinct()
                .sorted(String::compareToIgnoreCase)
                .toList();

        return new AdminUserDetailResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getPhone(),
                user.isActive(),
                appRoles,
                courierProfile == null ? null : courierProfile.getServiceCity(),
                pointAssignment == null || pointAssignment.getPoint() == null ? null : pointAssignment.getPoint().getPointCode(),
                pointAssignment == null || pointAssignment.getPoint() == null ? null : pointAssignment.getPoint().getName(),
                user.getCreatedAt()
        );
    }

    private String toSystemRole(String appRole) {
        if (appRole == null) return null;
        return switch (appRole.trim().toLowerCase(Locale.ROOT)) {
            case "client" -> RoleCatalog.CLIENT;
            case "courier" -> RoleCatalog.COURIER;
            case "point" -> RoleCatalog.POINT_WORKER;
            case "admin" -> RoleCatalog.ADMIN;
            case "dispatcher" -> RoleCatalog.DISPATCHER;
            default -> null;
        };
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
