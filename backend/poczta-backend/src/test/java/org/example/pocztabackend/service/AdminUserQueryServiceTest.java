package org.example.pocztabackend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.example.pocztabackend.dto.AdminUserDetailResponse;
import org.example.pocztabackend.dto.AdminUserUpdateRequest;
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
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AdminUserQueryServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private CourierProfileRepository courierProfileRepository;
    @Mock private PointStaffAssignmentRepository pointStaffAssignmentRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private PointRepository pointRepository;

    private AdminUserQueryService service;

    @BeforeEach
    void setUp() {
        service = new AdminUserQueryService(
                userRepository,
                courierProfileRepository,
                pointStaffAssignmentRepository,
                roleRepository,
                pointRepository
        );
    }

    private User stubUser(UUID id, String email) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setFirstName("Jan");
        user.setLastName("Kowalski");
        user.setRoles(new HashSet<>());
        when(userRepository.findById(id)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(courierProfileRepository.findByUser_Id(id)).thenReturn(Optional.empty());
        when(pointStaffAssignmentRepository
                .findFirstByUser_IdAndActiveTrueOrderByPrimaryAssignmentDescIdAsc(id))
                .thenReturn(Optional.empty());
        when(pointStaffAssignmentRepository.findAllByUser_IdAndActiveTrue(id))
                .thenReturn(Collections.emptyList());
        return user;
    }

    // --- basic field update ---

    @Test
    void shouldUpdateFirstAndLastName() {
        UUID userId = UUID.randomUUID();
        stubUser(userId, "jan@example.com");

        AdminUserUpdateRequest request = new AdminUserUpdateRequest(
                "Piotr", "Nowak", null, null, null, null);

        AdminUserDetailResponse result = service.updateUser(userId, request);

        assertEquals("Piotr", result.firstName());
        assertEquals("Nowak", result.lastName());
    }

    @Test
    void shouldUpdatePhone() {
        UUID userId = UUID.randomUUID();
        stubUser(userId, "jan@example.com");

        AdminUserUpdateRequest request = new AdminUserUpdateRequest(
                null, null, "+48 123 456 789", null, null, null);

        AdminUserDetailResponse result = service.updateUser(userId, request);

        assertEquals("+48 123 456 789", result.phone());
    }

    // --- roles update ---

    @Test
    void shouldReplaceRolesWhenRolesListProvided() {
        UUID userId = UUID.randomUUID();
        stubUser(userId, "jan@example.com");

        Role clientRole = Role.builder().id(UUID.randomUUID()).name(RoleCatalog.CLIENT).build();
        when(roleRepository.findByName(RoleCatalog.CLIENT)).thenReturn(Optional.of(clientRole));

        AdminUserUpdateRequest request = new AdminUserUpdateRequest(
                null, null, null, List.of("client"), null, null);

        service.updateUser(userId, request);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertEquals(1, captor.getValue().getRoles().size());
        assertEquals(RoleCatalog.CLIENT, captor.getValue().getRoles().iterator().next().getName());
    }

    @Test
    void shouldSkipUnknownRoleNames() {
        UUID userId = UUID.randomUUID();
        stubUser(userId, "jan@example.com");

        AdminUserUpdateRequest request = new AdminUserUpdateRequest(
                null, null, null, List.of("unknown_role"), null, null);

        service.updateUser(userId, request);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertEquals(0, captor.getValue().getRoles().size());
    }

    // --- serviceCity update ---

    @Test
    void shouldCreateCourierProfileWhenServiceCityProvided() {
        UUID userId = UUID.randomUUID();
        User user = stubUser(userId, "courier@example.com");
        when(courierProfileRepository.save(any(CourierProfile.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        AdminUserUpdateRequest request = new AdminUserUpdateRequest(
                null, null, null, null, "Warszawa", null);

        service.updateUser(userId, request);

        ArgumentCaptor<CourierProfile> captor = ArgumentCaptor.forClass(CourierProfile.class);
        verify(courierProfileRepository).save(captor.capture());
        assertEquals("Warszawa", captor.getValue().getServiceCity());
        assertEquals(user.getId(), captor.getValue().getUser().getId());
    }

    @Test
    void shouldClearServiceCityWhenEmptyStringProvided() {
        UUID userId = UUID.randomUUID();
        User user = stubUser(userId, "courier@example.com");

        CourierProfile existingProfile = new CourierProfile();
        existingProfile.setUser(user);
        existingProfile.setServiceCity("Kraków");
        when(courierProfileRepository.findByUser_Id(userId))
                .thenReturn(Optional.of(existingProfile))
                .thenReturn(Optional.of(existingProfile));
        when(courierProfileRepository.save(any(CourierProfile.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        AdminUserUpdateRequest request = new AdminUserUpdateRequest(
                null, null, null, null, "", null);

        service.updateUser(userId, request);

        ArgumentCaptor<CourierProfile> captor = ArgumentCaptor.forClass(CourierProfile.class);
        verify(courierProfileRepository).save(captor.capture());
        assertNull(captor.getValue().getServiceCity());
    }

    // --- pointCode assignment ---

    @Test
    void shouldCreatePointStaffAssignmentWhenPointCodeProvided() {
        UUID userId = UUID.randomUUID();
        User user = stubUser(userId, "point@example.com");

        Point point = new Point();
        point.setId(UUID.randomUUID());
        point.setPointCode("POP-WAW-01");
        point.setName("Punkt Odbioru Warszawa");
        when(pointRepository.findByPointCode("POP-WAW-01")).thenReturn(Optional.of(point));
        when(pointStaffAssignmentRepository.save(any(PointStaffAssignment.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        AdminUserUpdateRequest request = new AdminUserUpdateRequest(
                null, null, null, null, null, "POP-WAW-01");

        service.updateUser(userId, request);

        ArgumentCaptor<PointStaffAssignment> captor = ArgumentCaptor.forClass(PointStaffAssignment.class);
        verify(pointStaffAssignmentRepository).save(captor.capture());
        assertEquals(user.getId(), captor.getValue().getUser().getId());
        assertEquals(point.getId(), captor.getValue().getPoint().getId());
        assertEquals("POINT_WORKER", captor.getValue().getAssignmentRole());
    }

    @Test
    void shouldDeactivateExistingAssignmentsWhenNewPointCodeProvided() {
        UUID userId = UUID.randomUUID();
        User user = stubUser(userId, "point@example.com");

        PointStaffAssignment oldAssignment = new PointStaffAssignment();
        oldAssignment.setUser(user);
        oldAssignment.setActive(true);
        when(pointStaffAssignmentRepository.findAllByUser_IdAndActiveTrue(userId))
                .thenReturn(List.of(oldAssignment));
        when(pointStaffAssignmentRepository.save(any(PointStaffAssignment.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        Point point = new Point();
        point.setId(UUID.randomUUID());
        point.setPointCode("POP-WAW-02");
        when(pointRepository.findByPointCode("POP-WAW-02")).thenReturn(Optional.of(point));

        AdminUserUpdateRequest request = new AdminUserUpdateRequest(
                null, null, null, null, null, "POP-WAW-02");

        service.updateUser(userId, request);

        // First save deactivates old assignment
        ArgumentCaptor<PointStaffAssignment> captor = ArgumentCaptor.forClass(PointStaffAssignment.class);
        verify(pointStaffAssignmentRepository, org.mockito.Mockito.times(2)).save(captor.capture());
        // First captured — deactivated old
        assertEquals(false, captor.getAllValues().get(0).isActive());
        // Second captured — new active assignment
        assertEquals(true, captor.getAllValues().get(1).isActive());
    }

    @Test
    void shouldDeactivateAllAssignmentsWhenPointCodeClearedToEmpty() {
        UUID userId = UUID.randomUUID();
        User user = stubUser(userId, "point@example.com");

        PointStaffAssignment old = new PointStaffAssignment();
        old.setUser(user);
        old.setActive(true);
        when(pointStaffAssignmentRepository.findAllByUser_IdAndActiveTrue(userId))
                .thenReturn(List.of(old));
        when(pointStaffAssignmentRepository.save(any(PointStaffAssignment.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        AdminUserUpdateRequest request = new AdminUserUpdateRequest(
                null, null, null, null, null, "");

        service.updateUser(userId, request);

        verify(pointStaffAssignmentRepository, org.mockito.Mockito.times(1)).save(old);
        assertEquals(false, old.isActive());
        verify(pointRepository, never()).findByPointCode(any());
    }

    // --- not found ---

    @Test
    void shouldThrow404WhenUserNotFound() {
        UUID userId = UUID.randomUUID();
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class, () ->
                service.updateUser(userId, new AdminUserUpdateRequest(
                        "X", null, null, null, null, null)));
    }

    @Test
    void shouldThrow404WhenPointCodeNotFound() {
        UUID userId = UUID.randomUUID();
        stubUser(userId, "point@example.com");
        when(pointRepository.findByPointCode("NONEXISTENT")).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class, () ->
                service.updateUser(userId, new AdminUserUpdateRequest(
                        null, null, null, null, null, "NONEXISTENT")));
    }
}
