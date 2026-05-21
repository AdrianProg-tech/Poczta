package org.example.pocztabackend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.example.pocztabackend.dto.TrackingEventRequest;
import org.example.pocztabackend.dto.TrackingEventResponse;
import org.example.pocztabackend.service.TrackingEventService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@CrossOrigin
@RestController
@RequestMapping("/api/tracking")
@Tag(name = "Zdarzenia trackingowe", description = "Dodawanie i pobieranie zdarzeń śledzenia przesyłek")
public class TrackingEventController {

    private final TrackingEventService trackingEventService;

    public TrackingEventController(TrackingEventService trackingEventService) {
        this.trackingEventService = trackingEventService;
    }

    @PostMapping
    @Operation(summary = "Dodaj zdarzenie trackingowe do przesyłki")
    public ResponseEntity<TrackingEventResponse> addEvent(@Valid @RequestBody TrackingEventRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(trackingEventService.addEvent(request));
    }

    @PatchMapping("/bulk-status")
    @Operation(summary = "Masowo zaktualizuj statusy przesyłek")
    public ResponseEntity<Void> updateBulkStatus(
            @Valid @RequestBody org.example.pocztabackend.dto.BulkStatusUpdateRequest request
    ) {
        trackingEventService.updateBulkStatus(request);
        return ResponseEntity.noContent().build(); // Po wykonaniu zadania, zwracamy odpowiedź
    }

    @GetMapping("/{shipmentId}")
    @Operation(summary = "Pobierz historię zdarzeń trackingowych przesyłki")
    public ResponseEntity<List<TrackingEventResponse>> getHistory(@PathVariable UUID shipmentId) {
        return ResponseEntity.ok(trackingEventService.getHistory(shipmentId));
    }
}
