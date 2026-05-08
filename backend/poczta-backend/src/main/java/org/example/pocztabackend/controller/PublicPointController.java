package org.example.pocztabackend.controller;

import org.example.pocztabackend.dto.PublicPointResponse;
import org.example.pocztabackend.repository.PointRepository;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/public/points")
public class PublicPointController {

    private final PointRepository pointRepository;

    public PublicPointController(PointRepository pointRepository) {
        this.pointRepository = pointRepository;
    }

    @GetMapping
    public List<PublicPointResponse> listPublicPoints(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String type,
            @RequestParam(required = false, defaultValue = "true") boolean activeOnly
    ) {
        String normalizedCity = city == null ? null : city.trim().toLowerCase(Locale.ROOT);
        String normalizedType = type == null ? null : type.trim().toUpperCase(Locale.ROOT);

        return pointRepository.findAll().stream()
                .filter(point -> !activeOnly || point.isActive())
                .filter(point -> !StringUtils.hasText(normalizedCity)
                        || (point.getCity() != null && point.getCity().trim().toLowerCase(Locale.ROOT).equals(normalizedCity)))
                .filter(point -> !StringUtils.hasText(normalizedType)
                        || normalizedType.equalsIgnoreCase(point.getType()))
                .map(PublicPointResponse::fromEntity)
                .toList();
    }
}
