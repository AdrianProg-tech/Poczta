package org.example.pocztabackend.service;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import org.example.pocztabackend.dto.DemoUserOptionResponse;
import org.example.pocztabackend.model.CourierProfile;
import org.example.pocztabackend.model.PointStaffAssignment;
import org.example.pocztabackend.model.User;
import org.example.pocztabackend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthDemoUserService {

    private final UserRepository userRepository;
    private final OperationalActorResolver operationalActorResolver;

    public AuthDemoUserService(
            UserRepository userRepository,
            OperationalActorResolver operationalActorResolver
    ) {
        this.userRepository = userRepository;
        this.operationalActorResolver = operationalActorResolver;
    }

    public List<DemoUserOptionResponse> listDemoUsers(String rawGroup) {
        DemoUserGroup group = DemoUserGroup.fromQuery(rawGroup);

        return userRepository.findAll().stream()
                .filter(User::isActive)
                .filter(user -> matchesGroup(user, group))
                .map(user -> toResponse(user, group))
                .sorted(Comparator
                        .comparing(DemoUserOptionResponse::displayName, String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(DemoUserOptionResponse::email, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    private boolean matchesGroup(User user, DemoUserGroup group) {
        return switch (group) {
            case CLIENT -> operationalActorResolver.hasRole(user, RoleCatalog.CLIENT);
            case COURIER -> operationalActorResolver.hasRole(user, RoleCatalog.COURIER);
            case POINT -> operationalActorResolver.hasRole(user, RoleCatalog.POINT_WORKER);
            case ADMIN -> operationalActorResolver.hasRole(user, RoleCatalog.ADMIN);
            case DISPATCHER -> operationalActorResolver.hasRole(user, RoleCatalog.DISPATCHER);
        };
    }

    private DemoUserOptionResponse toResponse(User user, DemoUserGroup group) {
        CourierProfile courierProfile = operationalActorResolver.getCourierProfile(user);
        PointStaffAssignment pointAssignment = operationalActorResolver.getPrimaryPointAssignment(user);

        return new DemoUserOptionResponse(
                user.getEmail(),
                resolveDisplayName(user),
                group.appRole,
                group.adminScope,
                pointAssignment == null || pointAssignment.getPoint() == null ? null : pointAssignment.getPoint().getPointCode(),
                pointAssignment == null || pointAssignment.getPoint() == null ? null : pointAssignment.getPoint().getName(),
                courierProfile == null ? null : courierProfile.getServiceCity()
        );
    }

    private String resolveDisplayName(User user) {
        String firstName = user.getFirstName() == null ? "" : user.getFirstName().trim();
        String lastName = user.getLastName() == null ? "" : user.getLastName().trim();
        String displayName = (firstName + " " + lastName).trim();
        return displayName.isBlank() ? user.getEmail() : displayName;
    }

    private enum DemoUserGroup {
        CLIENT("client", "client", null),
        COURIER("courier", "courier", null),
        POINT("point", "point", null),
        ADMIN("admin", "admin", "ADMIN"),
        DISPATCHER("dispatcher", "admin", "DISPATCHER");

        private final String queryValue;
        private final String appRole;
        private final String adminScope;

        DemoUserGroup(String queryValue, String appRole, String adminScope) {
            this.queryValue = queryValue;
            this.appRole = appRole;
            this.adminScope = adminScope;
        }

        static DemoUserGroup fromQuery(String rawValue) {
            if (rawValue == null || rawValue.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Demo user group is required");
            }

            String normalized = rawValue.trim().toLowerCase(Locale.ROOT);
            for (DemoUserGroup candidate : values()) {
                if (candidate.queryValue.equals(normalized)) {
                    return candidate;
                }
            }

            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported demo user group: " + rawValue);
        }
    }
}
