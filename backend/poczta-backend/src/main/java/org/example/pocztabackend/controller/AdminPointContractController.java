package org.example.pocztabackend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.example.pocztabackend.dto.AdminPointUpdateRequest;
import org.example.pocztabackend.dto.PointToggleActiveResponse;
import org.example.pocztabackend.dto.PointResponse;
import org.example.pocztabackend.model.Point;
import org.example.pocztabackend.repository.PointRepository;
import org.example.pocztabackend.service.OperationalActorResolver;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

@RestController
@RequestMapping("/api/admin/points")
@Tag(name = "Punkty (admin)", description = "Zarządzanie punktami odbioru przez administratora")
public class AdminPointContractController {

    private final PointRepository pointRepository;
    private final OperationalActorResolver operationalActorResolver;

    public AdminPointContractController(
            PointRepository pointRepository,
            OperationalActorResolver operationalActorResolver
    ) {
        this.pointRepository = pointRepository;
        this.operationalActorResolver = operationalActorResolver;
    }

    @PatchMapping("/by-code/{pointCode}")
    @Transactional
    @Operation(summary = "Zaktualizuj dane punktu odbioru")
    public PointResponse updatePoint(@PathVariable String pointCode, @RequestBody AdminPointUpdateRequest request) {
        operationalActorResolver.requireAdminActor(false);
        Point point = pointRepository.findByPointCode(pointCode.trim().toUpperCase(Locale.ROOT))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Point not found"));
        if (StringUtils.hasText(request.name())) point.setName(request.name().trim());
        if (request.address() != null) point.setAddress(request.address().trim());
        if (request.city() != null) point.setCity(request.city().trim());
        if (request.postalCode() != null) point.setPostalCode(request.postalCode().trim());
        if (request.phone() != null) point.setPhone(request.phone().trim());
        if (request.openingHours() != null) point.setOpeningHours(request.openingHours().trim());
        pointRepository.save(point);
        return PointResponse.fromEntity(point);
    }

    @PostMapping("/by-code/{pointCode}/toggle-active")
    @Transactional
    @Operation(summary = "Przełącz aktywność punktu odbioru")
    public PointToggleActiveResponse toggleActive(@PathVariable String pointCode) {
        operationalActorResolver.requireAdminActor(false);
        Point point = pointRepository.findByPointCode(pointCode.trim().toUpperCase(Locale.ROOT))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Point not found"));
        point.setActive(!point.isActive());
        pointRepository.save(point);
        return new PointToggleActiveResponse(point.getId(), point.getPointCode(), point.getName(), point.isActive());
    }
}
