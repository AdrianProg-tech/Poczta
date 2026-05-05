package org.example.pocztabackend.controller;

// zrobiłem po to żeby nie było potrzebne nam żadne dodatkowe uwierzytelnienie
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
//@RequiredArgsConstructor
public class PublicTrackingController {

    private final TrackingEventService trackingEventService;

    public PublicTrackingController(TrackingEventService trackingEventService) {
        this.trackingEventService = trackingEventService;
    }

    @GetMapping("/{trackingNumber}")
    public ResponseEntity<PublicShipmentTrackingResponse> trackShipment(@PathVariable String trackingNumber) {
        return ResponseEntity.ok(trackingEventService.getPublicTracking(trackingNumber));
    }
}
