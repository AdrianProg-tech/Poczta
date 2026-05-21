package org.example.pocztabackend.controller;

// zrobiłem po to żeby nie było potrzebne nam żadne dodatkowe uwierzytelnienie
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.example.pocztabackend.dto.PublicShipmentTrackingResponse;
import org.example.pocztabackend.service.TrackingEventService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/tracking")
@Tag(name = "Śledzenie (publiczne)", description = "Publiczne śledzenie przesyłek bez uwierzytelnienia")
//@RequiredArgsConstructor
public class PublicTrackingController {

    private final TrackingEventService trackingEventService;

    public PublicTrackingController(TrackingEventService trackingEventService) {
        this.trackingEventService = trackingEventService;
    }

    @GetMapping("/{trackingNumber}")
    @Operation(summary = "Pobierz publiczne dane śledzenia przesyłki")
    public ResponseEntity<PublicShipmentTrackingResponse> trackShipment(@PathVariable String trackingNumber) {
        return ResponseEntity.ok(trackingEventService.getPublicTracking(trackingNumber));
    }
}
