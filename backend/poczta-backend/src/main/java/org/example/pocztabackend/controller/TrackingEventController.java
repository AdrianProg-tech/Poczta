package org.example.pocztabackend.controller;

import jakarta.validation.Valid;
import org.example.pocztabackend.dto.TrackingEventRequest;
import org.example.pocztabackend.dto.TrackingEventResponse;
import org.example.pocztabackend.service.TrackingEventService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tracking")
public class TrackingEventController {

    private final TrackingEventService trackingEventService;

    public TrackingEventController(TrackingEventService trackingEventService) {
        this.trackingEventService = trackingEventService;
    }

    @PostMapping
    public ResponseEntity<TrackingEventResponse> addEvent(@Valid @RequestBody TrackingEventRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(trackingEventService.addEvent(request));
    }

    @PostMapping("/bulk-status")
    public ResponseEntity<Void> updateBulkStatus(
            @Valid @RequestBody org.example.pocztabackend.dto.BulkStatusUpdateRequest request
    ) {
        trackingEventService.updateBulkStatus(request);
        return ResponseEntity.noContent().build(); // Po wykonaniu zadania, zwracamy odpowiedź
    }

    @GetMapping("/{shipmentId}")
    public ResponseEntity<List<TrackingEventResponse>> getHistory(@PathVariable UUID shipmentId) {
        return ResponseEntity.ok(trackingEventService.getHistory(shipmentId));
    }
}
