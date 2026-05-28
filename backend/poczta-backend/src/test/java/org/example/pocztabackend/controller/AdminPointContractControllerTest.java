package org.example.pocztabackend.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;
import org.example.pocztabackend.dto.AdminPointUpdateRequest;
import org.example.pocztabackend.dto.PointResponse;
import org.example.pocztabackend.model.Point;
import org.example.pocztabackend.repository.PointRepository;
import org.example.pocztabackend.service.OperationalActorResolver;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class AdminPointContractControllerTest {

    @Mock
    private PointRepository pointRepository;

    @Mock
    private OperationalActorResolver operationalActorResolver;

    private AdminPointContractController controller;

    @BeforeEach
    void setUp() {
        controller = new AdminPointContractController(pointRepository, operationalActorResolver);
    }

    private Point stubPoint(String pointCode) {
        Point point = new Point();
        point.setId(UUID.randomUUID());
        point.setPointCode(pointCode);
        point.setType("PICKUP_POINT");
        point.setName("Stara nazwa");
        point.setCity("Stare miasto");
        point.setAddress("Stara ulica 1");
        point.setPostalCode("00-000");
        point.setPhone("+48000000000");
        point.setOpeningHours("Pn-Pt 8-20");
        point.setActive(true);
        when(pointRepository.findByPointCode(pointCode)).thenReturn(Optional.of(point));
        when(pointRepository.save(any(Point.class))).thenAnswer(inv -> inv.getArgument(0));
        return point;
    }

    // --- basic field updates ---

    @Test
    void shouldUpdateNameCityAndPhone() {
        stubPoint("POP-WAW-01");

        AdminPointUpdateRequest request = new AdminPointUpdateRequest(
                "Nowa nazwa", null, "Nowe miasto", null, "+48111222333", null);

        PointResponse response = controller.updatePoint("POP-WAW-01", request);

        assertEquals("Nowa nazwa", response.name());
        assertEquals("Nowe miasto", response.city());
        assertEquals("+48111222333", response.phone());
    }

    @Test
    void shouldLeaveUnchangedFieldsIntact() {
        stubPoint("POP-WAW-02");

        AdminPointUpdateRequest request = new AdminPointUpdateRequest(
                "Nowa nazwa", null, null, null, null, null);

        PointResponse response = controller.updatePoint("POP-WAW-02", request);

        assertEquals("Stara ulica 1", response.address());
        assertEquals("00-000", response.postalCode());
        assertEquals("+48000000000", response.phone());
        assertEquals("Pn-Pt 8-20", response.openingHours());
    }

    @Test
    void shouldUpdateAllFields() {
        stubPoint("POP-WAW-03");

        AdminPointUpdateRequest request = new AdminPointUpdateRequest(
                "Nowa", "Nowa ulica 2", "Gdansk", "80-100", "+48999888777", "Pn-Nd 0-24");

        PointResponse response = controller.updatePoint("POP-WAW-03", request);

        assertEquals("Nowa", response.name());
        assertEquals("Nowa ulica 2", response.address());
        assertEquals("Gdansk", response.city());
        assertEquals("80-100", response.postalCode());
        assertEquals("+48999888777", response.phone());
        assertEquals("Pn-Nd 0-24", response.openingHours());
    }

    // --- name guard (StringUtils.hasText) ---

    @Test
    void shouldSkipBlankName() {
        stubPoint("POP-WAW-04");

        AdminPointUpdateRequest request = new AdminPointUpdateRequest(
                "   ", null, null, null, null, null);

        PointResponse response = controller.updatePoint("POP-WAW-04", request);

        assertEquals("Stara nazwa", response.name());
    }

    @Test
    void shouldSkipNullName() {
        stubPoint("POP-WAW-05");

        AdminPointUpdateRequest request = new AdminPointUpdateRequest(
                null, null, "Krakow", null, null, null);

        PointResponse response = controller.updatePoint("POP-WAW-05", request);

        assertEquals("Stara nazwa", response.name());
        assertEquals("Krakow", response.city());
    }

    // --- pointCode normalization ---

    @Test
    void shouldNormalizePointCodeToUpperCase() {
        stubPoint("POP-WAW-06");

        AdminPointUpdateRequest request = new AdminPointUpdateRequest(
                "Punkt", null, null, null, null, null);

        controller.updatePoint("pop-waw-06", request);

        verify(pointRepository).findByPointCode("POP-WAW-06");
    }

    @Test
    void shouldTrimPointCodeBeforeNormalization() {
        stubPoint("POP-WAW-07");

        AdminPointUpdateRequest request = new AdminPointUpdateRequest(
                "Punkt", null, null, null, null, null);

        controller.updatePoint("  POP-WAW-07  ", request);

        verify(pointRepository).findByPointCode("POP-WAW-07");
    }

    // --- save is always called ---

    @Test
    void shouldAlwaysPersistPointEvenWithAllNullFields() {
        Point point = stubPoint("POP-WAW-08");

        AdminPointUpdateRequest request = new AdminPointUpdateRequest(
                null, null, null, null, null, null);

        controller.updatePoint("POP-WAW-08", request);

        ArgumentCaptor<Point> captor = ArgumentCaptor.forClass(Point.class);
        verify(pointRepository).save(captor.capture());
        assertEquals(point.getId(), captor.getValue().getId());
    }

    // --- 404 handling ---

    @Test
    void shouldThrow404WhenPointCodeNotFound() {
        when(pointRepository.findByPointCode("NONEXISTENT")).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> controller.updatePoint("NONEXISTENT", new AdminPointUpdateRequest(
                        "Name", null, null, null, null, null)));

        assertEquals(404, exception.getStatusCode().value());
    }
}
