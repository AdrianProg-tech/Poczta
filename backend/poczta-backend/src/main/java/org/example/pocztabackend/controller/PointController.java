package org.example.pocztabackend.controller;

import jakarta.validation.Valid;
import org.example.pocztabackend.dto.PointRequest;
import org.example.pocztabackend.dto.PointResponse;
import org.example.pocztabackend.model.Point;
import org.example.pocztabackend.repository.PointRepository;
import org.springframework.http.HttpStatus;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@RestController
@RequestMapping("/api/points")
public class PointController {

    private final PointRepository pointRepository;

    public PointController(PointRepository pointRepository) {
        this.pointRepository = pointRepository;
    }

    @GetMapping
    public List<PointResponse> getAllPoints() {
        return pointRepository.findAll().stream()
                .map(PointResponse::fromEntity)
                .toList();
    }

    @GetMapping("/{id}")
    public PointResponse getPointById(@PathVariable UUID id) {
        return pointRepository.findById(id)
                .map(PointResponse::fromEntity)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Point not found"));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PointResponse createPoint(@Valid @RequestBody PointRequest request) {
        if (!StringUtils.hasText(request.name())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name is required");
        }
        if (!StringUtils.hasText(request.type())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "type is required");
        }

        Point point = new Point();
        point.setPointCode(resolvePointCode(request));
        point.setName(request.name());
        point.setType(request.type().trim().toUpperCase(Locale.ROOT));
        point.setCity(request.city());
        point.setAddress(request.address());
        point.setPostalCode(request.postalCode());
        point.setPhone(request.phone());
        point.setOpeningHours(request.openingHours());
        point.setActive(Boolean.TRUE.equals(request.active()));

        return PointResponse.fromEntity(pointRepository.save(point));
    }

    private String resolvePointCode(PointRequest request) {
        if (StringUtils.hasText(request.pointCode())) {
            String normalized = request.pointCode().trim().toUpperCase(Locale.ROOT);
            if (pointRepository.findByPointCode(normalized).isPresent()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "pointCode already exists");
            }
            return normalized;
        }

        String prefix = "PICKUP_POINT".equalsIgnoreCase(request.type()) ? "POP" : "PLK";
        String candidate;
        do {
            candidate = prefix + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase(Locale.ROOT);
        } while (pointRepository.findByPointCode(candidate).isPresent());

        return candidate;
    }
}
