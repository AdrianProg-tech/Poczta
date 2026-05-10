package org.example.pocztabackend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private CourierProfileRepository courierProfileRepository;

    @Mock
    private PointStaffAssignmentRepository pointStaffAssignmentRepository;

    @Mock
    private PointRepository pointRepository;

    private UserService userService;

    @BeforeEach
    void setUp() {
        userService = new UserService(
                userRepository,
                roleRepository,
                courierProfileRepository,
                pointStaffAssignmentRepository,
                pointRepository
        );
    }

    @Test
    void shouldCreateCourierUserWithRoleAndProfile() {
        Role courierRole = Role.builder().id(UUID.randomUUID()).name(RoleCatalog.COURIER).build();
        when(userRepository.existsByEmail("courier@example.com")).thenReturn(false);
        when(roleRepository.findByName(RoleCatalog.COURIER)).thenReturn(Optional.of(courierRole));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(UUID.randomUUID());
            return user;
        });

        User created = userService.createUser(new UserRequest(
                "Piotr",
                "Courier",
                "courier@example.com",
                "+48500111222",
                "COURIER",
                "WARSAW",
                null
        ));

        assertEquals("courier@example.com", created.getEmail());
        assertTrue(created.getRoles().stream().anyMatch(role -> RoleCatalog.COURIER.equals(role.getName())));

        ArgumentCaptor<CourierProfile> profileCaptor = ArgumentCaptor.forClass(CourierProfile.class);
        verify(courierProfileRepository).save(profileCaptor.capture());
        assertEquals("WARSAW", profileCaptor.getValue().getServiceCity());
        assertEquals(created.getId(), profileCaptor.getValue().getUser().getId());
    }

    @Test
    void shouldCreatePointWorkerWithAssignment() {
        Role pointRole = Role.builder().id(UUID.randomUUID()).name(RoleCatalog.POINT_WORKER).build();
        Point point = new Point();
        point.setId(UUID.randomUUID());
        point.setPointCode("POP-WAW-01");

        when(userRepository.existsByEmail("point@example.com")).thenReturn(false);
        when(roleRepository.findByName(RoleCatalog.POINT_WORKER)).thenReturn(Optional.of(pointRole));
        when(pointRepository.findByPointCode("POP-WAW-01")).thenReturn(Optional.of(point));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(UUID.randomUUID());
            return user;
        });

        User created = userService.createUser(new UserRequest(
                "Point",
                "Warsaw",
                "point@example.com",
                "+48500999888",
                "POINT_WORKER",
                "WARSAW",
                "pop-waw-01"
        ));

        assertTrue(created.getRoles().stream().anyMatch(role -> RoleCatalog.POINT_WORKER.equals(role.getName())));

        ArgumentCaptor<PointStaffAssignment> assignmentCaptor = ArgumentCaptor.forClass(PointStaffAssignment.class);
        verify(pointStaffAssignmentRepository).save(assignmentCaptor.capture());
        assertEquals(created.getId(), assignmentCaptor.getValue().getUser().getId());
        assertEquals(point.getId(), assignmentCaptor.getValue().getPoint().getId());
        assertTrue(assignmentCaptor.getValue().isPrimaryAssignment());
    }

    @Test
    void shouldCreateDispatcherWithoutOperationalProfile() {
        Role dispatcherRole = Role.builder().id(UUID.randomUUID()).name(RoleCatalog.DISPATCHER).build();
        when(userRepository.existsByEmail("ops.dispatch@example.com")).thenReturn(false);
        when(roleRepository.findByName(RoleCatalog.DISPATCHER)).thenReturn(Optional.of(dispatcherRole));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(UUID.randomUUID());
            return user;
        });

        User created = userService.createUser(new UserRequest(
                "Damian",
                "Dispatcher",
                "ops.dispatch@example.com",
                "+48520100101",
                "DISPATCHER",
                "",
                null
        ));

        assertEquals("ops.dispatch@example.com", created.getEmail());
        assertTrue(created.getRoles().stream().anyMatch(role -> RoleCatalog.DISPATCHER.equals(role.getName())));
        assertFalse(created.getRoles().stream().anyMatch(role -> RoleCatalog.ADMIN.equals(role.getName())));
        verifyNoInteractions(courierProfileRepository);
        verifyNoInteractions(pointStaffAssignmentRepository);
    }
}
