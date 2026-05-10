package org.example.pocztabackend.service;

import org.example.pocztabackend.dto.UserRequest;
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

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final CourierProfileRepository courierProfileRepository;
    private final PointStaffAssignmentRepository pointStaffAssignmentRepository;
    private final PointRepository pointRepository;

    public UserService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            CourierProfileRepository courierProfileRepository,
            PointStaffAssignmentRepository pointStaffAssignmentRepository,
            PointRepository pointRepository
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.courierProfileRepository = courierProfileRepository;
        this.pointStaffAssignmentRepository = pointStaffAssignmentRepository;
        this.pointRepository = pointRepository;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nie znaleziono użytkownika"));
    }

    @Transactional
    public User createUser(UserRequest request) {
        if (request.email() == null || request.email().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User with this email already exists");
        }

        User user = new User();
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setEmail(request.email());
        user.setPhone(request.phone());
        user.setActive(true);
        user.setCreatedAt(LocalDateTime.now());
        user.setRoles(resolveRoles(request));

        User savedUser = userRepository.save(user);
        createOperationalProfile(savedUser, request);
        return savedUser;
    }

    private Set<Role> resolveRoles(UserRequest request) {
        Set<Role> roles = new LinkedHashSet<>();
        String persona = normalize(request.persona());
        if (persona == null) {
            roles.add(requireRole(RoleCatalog.CLIENT));
            return roles;
        }

        switch (persona) {
            case RoleCatalog.ADMIN -> roles.add(requireRole(RoleCatalog.ADMIN));
            case RoleCatalog.DISPATCHER -> roles.add(requireRole(RoleCatalog.DISPATCHER));
            case RoleCatalog.COURIER -> roles.add(requireRole(RoleCatalog.COURIER));
            case RoleCatalog.POINT_WORKER -> roles.add(requireRole(RoleCatalog.POINT_WORKER));
            case RoleCatalog.CLIENT -> roles.add(requireRole(RoleCatalog.CLIENT));
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported persona: " + request.persona());
        }

        return roles;
    }

    private void createOperationalProfile(User savedUser, UserRequest request) {
        String persona = normalize(request.persona());
        if (RoleCatalog.COURIER.equals(persona)) {
            if (!StringUtils.hasText(request.serviceCity())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "serviceCity is required for courier users");
            }
            CourierProfile courierProfile = new CourierProfile();
            courierProfile.setUser(savedUser);
            courierProfile.setServiceCity(request.serviceCity().trim());
            courierProfile.setActive(true);
            courierProfileRepository.save(courierProfile);
            return;
        }

        if (RoleCatalog.POINT_WORKER.equals(persona)) {
            if (!StringUtils.hasText(request.pointCode())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "pointCode is required for point worker users");
            }
            Point point = pointRepository.findByPointCode(request.pointCode().trim().toUpperCase(Locale.ROOT))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Point not found for pointCode"));

            PointStaffAssignment assignment = new PointStaffAssignment();
            assignment.setUser(savedUser);
            assignment.setPoint(point);
            assignment.setAssignmentRole(RoleCatalog.POINT_WORKER);
            assignment.setActive(true);
            assignment.setPrimaryAssignment(true);
            pointStaffAssignmentRepository.save(assignment);
        }
    }

    private Role requireRole(String roleName) {
        return roleRepository.findByName(roleName)
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name(roleName)
                        .description(roleName + " role")
                        .build()));
    }

    private String normalize(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim().toUpperCase(Locale.ROOT);
    }
}
