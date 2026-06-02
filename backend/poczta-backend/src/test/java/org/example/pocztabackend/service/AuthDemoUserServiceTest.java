package org.example.pocztabackend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.UUID;
import org.example.pocztabackend.dto.DemoUserOptionResponse;
import org.example.pocztabackend.model.CourierProfile;
import org.example.pocztabackend.model.Point;
import org.example.pocztabackend.model.PointStaffAssignment;
import org.example.pocztabackend.model.Role;
import org.example.pocztabackend.model.User;
import org.example.pocztabackend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class AuthDemoUserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private OperationalActorResolver operationalActorResolver;

    private AuthDemoUserService service;

    @BeforeEach
    void setUp() {
        service = new AuthDemoUserService(userRepository, operationalActorResolver);
    }

    @Test
    void returnsOnlyActiveUsersForRequestedGroup() {
        User activeClient = createUser("anna.client@example.com", true, RoleCatalog.CLIENT);
        activeClient.setFirstName("Anna");
        activeClient.setLastName("Klient");

        User inactiveClient = createUser("inactive.client@example.com", false, RoleCatalog.CLIENT);
        User courier = createUser("courier.warsaw.1@example.com", true, RoleCatalog.COURIER);

        when(userRepository.findAll()).thenReturn(List.of(courier, inactiveClient, activeClient));
        when(operationalActorResolver.hasRole(activeClient, RoleCatalog.CLIENT)).thenReturn(true);
        when(operationalActorResolver.hasRole(courier, RoleCatalog.CLIENT)).thenReturn(false);
        when(operationalActorResolver.getCourierProfile(activeClient)).thenReturn(null);
        when(operationalActorResolver.getPrimaryPointAssignment(activeClient)).thenReturn(null);

        List<DemoUserOptionResponse> result = service.listDemoUsers("client");

        assertEquals(1, result.size());
        assertEquals("anna.client@example.com", result.get(0).email());
        assertEquals("Anna Klient", result.get(0).displayName());
        assertEquals("client", result.get(0).appRole());
        assertNull(result.get(0).adminScope());
    }

    @Test
    void separatesAdminAndDispatcherGroupsAndIncludesMetadata() {
        User dispatcher = createUser("ops.dispatch@example.com", true, RoleCatalog.DISPATCHER);
        dispatcher.setFirstName("Ola");
        dispatcher.setLastName("Dispatch");

        User admin = createUser("admin.review@example.com", true, RoleCatalog.ADMIN);
        admin.setFirstName("Ada");
        admin.setLastName("Review");

        User pointUser = createUser("point.warsaw.pop-waw-01@example.com", true, RoleCatalog.POINT_WORKER);
        pointUser.setFirstName("Piotr");
        pointUser.setLastName("Point");

        User courier = createUser("courier.warsaw.1@example.com", true, RoleCatalog.COURIER);
        courier.setFirstName("Karol");
        courier.setLastName("Courier");

        when(userRepository.findAll()).thenReturn(List.of(dispatcher, admin, pointUser, courier));

        when(operationalActorResolver.hasRole(dispatcher, RoleCatalog.DISPATCHER)).thenReturn(true);
        when(operationalActorResolver.hasRole(admin, RoleCatalog.DISPATCHER)).thenReturn(false);
        when(operationalActorResolver.hasRole(pointUser, RoleCatalog.DISPATCHER)).thenReturn(false);
        when(operationalActorResolver.hasRole(courier, RoleCatalog.DISPATCHER)).thenReturn(false);

        when(operationalActorResolver.hasRole(dispatcher, RoleCatalog.ADMIN)).thenReturn(false);
        when(operationalActorResolver.hasRole(admin, RoleCatalog.ADMIN)).thenReturn(true);
        when(operationalActorResolver.hasRole(pointUser, RoleCatalog.ADMIN)).thenReturn(false);
        when(operationalActorResolver.hasRole(courier, RoleCatalog.ADMIN)).thenReturn(false);

        when(operationalActorResolver.hasRole(pointUser, RoleCatalog.POINT_WORKER)).thenReturn(true);
        when(operationalActorResolver.hasRole(dispatcher, RoleCatalog.POINT_WORKER)).thenReturn(false);
        when(operationalActorResolver.hasRole(admin, RoleCatalog.POINT_WORKER)).thenReturn(false);
        when(operationalActorResolver.hasRole(courier, RoleCatalog.POINT_WORKER)).thenReturn(false);

        when(operationalActorResolver.hasRole(courier, RoleCatalog.COURIER)).thenReturn(true);
        when(operationalActorResolver.hasRole(dispatcher, RoleCatalog.COURIER)).thenReturn(false);
        when(operationalActorResolver.hasRole(admin, RoleCatalog.COURIER)).thenReturn(false);
        when(operationalActorResolver.hasRole(pointUser, RoleCatalog.COURIER)).thenReturn(false);

        Point point = new Point();
        point.setPointCode("POP-WAW-01");
        point.setName("Warsaw Central Point");
        PointStaffAssignment assignment = new PointStaffAssignment();
        assignment.setPoint(point);

        CourierProfile profile = new CourierProfile();
        profile.setServiceCity("Warszawa");

        when(operationalActorResolver.getCourierProfile(dispatcher)).thenReturn(null);
        when(operationalActorResolver.getPrimaryPointAssignment(dispatcher)).thenReturn(null);
        when(operationalActorResolver.getCourierProfile(admin)).thenReturn(null);
        when(operationalActorResolver.getPrimaryPointAssignment(admin)).thenReturn(null);
        when(operationalActorResolver.getCourierProfile(pointUser)).thenReturn(null);
        when(operationalActorResolver.getPrimaryPointAssignment(pointUser)).thenReturn(assignment);
        when(operationalActorResolver.getCourierProfile(courier)).thenReturn(profile);
        when(operationalActorResolver.getPrimaryPointAssignment(courier)).thenReturn(null);

        List<DemoUserOptionResponse> dispatchers = service.listDemoUsers("dispatcher");
        List<DemoUserOptionResponse> admins = service.listDemoUsers("admin");
        List<DemoUserOptionResponse> points = service.listDemoUsers("point");
        List<DemoUserOptionResponse> couriers = service.listDemoUsers("courier");

        assertEquals(1, dispatchers.size());
        assertEquals("ops.dispatch@example.com", dispatchers.get(0).email());
        assertEquals("admin", dispatchers.get(0).appRole());
        assertEquals("DISPATCHER", dispatchers.get(0).adminScope());

        assertEquals(1, admins.size());
        assertEquals("admin.review@example.com", admins.get(0).email());
        assertEquals("ADMIN", admins.get(0).adminScope());

        assertEquals("POP-WAW-01", points.get(0).pointCode());
        assertEquals("Warsaw Central Point", points.get(0).pointName());
        assertEquals("Warszawa", couriers.get(0).serviceCity());
    }

    @Test
    void rejectsUnsupportedGroup() {
        assertThrows(ResponseStatusException.class, () -> service.listDemoUsers("unknown"));
    }

    private User createUser(String email, boolean active, String roleName) {
        Role role = new Role();
        role.setId(UUID.randomUUID());
        role.setName(roleName);

        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail(email);
        user.setActive(active);
        user.setRoles(new LinkedHashSet<>(List.of(role)));
        return user;
    }
}
