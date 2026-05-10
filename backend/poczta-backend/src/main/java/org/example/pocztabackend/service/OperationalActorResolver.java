package org.example.pocztabackend.service;

import java.util.Locale;
import org.example.pocztabackend.model.CourierProfile;
import org.example.pocztabackend.model.Point;
import org.example.pocztabackend.model.PointStaffAssignment;
import org.example.pocztabackend.model.Role;
import org.example.pocztabackend.model.User;
import org.example.pocztabackend.repository.CourierProfileRepository;
import org.example.pocztabackend.repository.PointRepository;
import org.example.pocztabackend.repository.PointStaffAssignmentRepository;
import org.example.pocztabackend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OperationalActorResolver {

    private final UserRepository userRepository;
    private final CourierProfileRepository courierProfileRepository;
    private final PointStaffAssignmentRepository pointStaffAssignmentRepository;
    private final PointRepository pointRepository;
    private final AuthSessionService authSessionService;

    public OperationalActorResolver(
            UserRepository userRepository,
            CourierProfileRepository courierProfileRepository,
            PointStaffAssignmentRepository pointStaffAssignmentRepository,
            PointRepository pointRepository,
            AuthSessionService authSessionService
    ) {
        this.userRepository = userRepository;
        this.courierProfileRepository = courierProfileRepository;
        this.pointStaffAssignmentRepository = pointStaffAssignmentRepository;
        this.pointRepository = pointRepository;
        this.authSessionService = authSessionService;
    }

    public User requireUserByEmailHeader(String userEmailHeader) {
        return authSessionService.resolveAuthenticatedUser(getCurrentAuthorizationHeader());
    }

    public User requireAuthenticatedUser() {
        return requireUserByEmailHeader(null);
    }

    public User requireRoleActor(String userEmailHeader, String expectedRole, String actorLabel) {
        User user = requireUserByEmailHeader(userEmailHeader);
        if (!hasRole(user, expectedRole)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User does not have " + actorLabel + " role");
        }
        return user;
    }

    public User requireCourierActor(String userEmailHeader) {
        User courier = requireRoleActor(userEmailHeader, RoleCatalog.COURIER, "courier");

        CourierProfile profile = courierProfileRepository.findByUser_Id(courier.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Courier profile not found"));
        if (!profile.isActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Courier profile is inactive");
        }

        return courier;
    }

    public User requireAdminActor(String userEmailHeader, boolean dispatcherAllowed) {
        User user = requireUserByEmailHeader(userEmailHeader);
        boolean isAdmin = hasRole(user, RoleCatalog.ADMIN);
        boolean isDispatcher = dispatcherAllowed && hasRole(user, RoleCatalog.DISPATCHER);
        if (!isAdmin && !isDispatcher) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User does not have admin access");
        }
        return user;
    }

    public User requireAdminActor(boolean dispatcherAllowed) {
        return requireAdminActor(null, dispatcherAllowed);
    }

    public Point requirePointActorPoint(String userEmailHeader) {
        User user = requireRoleActor(userEmailHeader, RoleCatalog.POINT_WORKER, "point worker");

        PointStaffAssignment assignment = pointStaffAssignmentRepository
                .findFirstByUser_IdAndActiveTrueOrderByPrimaryAssignmentDescIdAsc(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Point staff assignment not found"));

        return assignment.getPoint();
    }

    public Point requirePointActorPoint() {
        return requirePointActorPoint(null);
    }

    public User requireCourierActor() {
        return requireCourierActor(null);
    }

    public CourierProfile getCourierProfile(User user) {
        if (user == null || user.getId() == null) {
            return null;
        }
        return courierProfileRepository.findByUser_Id(user.getId()).orElse(null);
    }

    public PointStaffAssignment getPrimaryPointAssignment(User user) {
        if (user == null || user.getId() == null) {
            return null;
        }
        return pointStaffAssignmentRepository.findFirstByUser_IdAndActiveTrueOrderByPrimaryAssignmentDescIdAsc(user.getId())
                .orElse(null);
    }

    public boolean hasRole(User user, String expectedRole) {
        if (user == null || user.getRoles() == null) {
            return false;
        }
        return user.getRoles().stream()
                .map(Role::getName)
                .filter(name -> name != null && !name.isBlank())
                .map(name -> name.trim().toUpperCase(Locale.ROOT))
                .anyMatch(expectedRole::equals);
    }

    private String getCurrentAuthorizationHeader() {
        RequestAttributes requestAttributes = RequestContextHolder.getRequestAttributes();
        if (!(requestAttributes instanceof ServletRequestAttributes servletRequestAttributes)) {
            return null;
        }
        return servletRequestAttributes.getRequest().getHeader("Authorization");
    }
}
