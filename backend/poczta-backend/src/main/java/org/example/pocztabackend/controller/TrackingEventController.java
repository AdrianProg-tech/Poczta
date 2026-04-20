package org.example.pocztabackend.controller;

import lombok.RequiredArgsConstructor;
import org.example.pocztabackend.dto.TrackingEventRequest;
import org.example.pocztabackend.dto.TrackingEventResponse;
import org.example.pocztabackend.service.TrackingEventService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tracking")
@RequiredArgsConstructor
public class TrackingEventController {

    private final TrackingEventService trackingEventService;

    @PostMapping
    public ResponseEntity<TrackingEventResponse> addEvent(@RequestBody TrackingEventRequest request) {
        return ResponseEntity.ok(trackingEventService.addEvent(request));
    }

    @GetMapping("/{shipmentId}")
    public ResponseEntity<List<TrackingEventResponse>> getHistory(@PathVariable UUID shipmentId) {
        return ResponseEntity.ok(trackingEventService.getHistory(shipmentId));
    }
}