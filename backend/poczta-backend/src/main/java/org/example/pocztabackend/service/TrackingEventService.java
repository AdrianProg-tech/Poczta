package org.example.pocztabackend.service;

import org.example.pocztabackend.dto.TrackingEventRequest;
import org.example.pocztabackend.dto.TrackingEventResponse;
import org.example.pocztabackend.model.Shipment;
import org.example.pocztabackend.model.TrackingEvent;
import org.example.pocztabackend.repository.ShipmentRepository;
import org.example.pocztabackend.repository.TrackingEventRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.example.pocztabackend.dto.PublicShipmentTrackingResponse;
import org.example.pocztabackend.dto.PublicTrackingEventResponse;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class TrackingEventService {

    private final TrackingEventRepository trackingEventRepository;
    private final ShipmentRepository shipmentRepository;
    private final ShipmentWorkflowService shipmentWorkflowService;

    public TrackingEventService(
            TrackingEventRepository trackingEventRepository,
            ShipmentRepository shipmentRepository,
            ShipmentWorkflowService shipmentWorkflowService
    ) {
        this.trackingEventRepository = trackingEventRepository;
        this.shipmentRepository = shipmentRepository;
        this.shipmentWorkflowService = shipmentWorkflowService;
    }

    @Transactional
    public TrackingEventResponse addEvent(TrackingEventRequest request) {
        if (request.shipmentId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "shipmentId is required");
        }
        if (request.status() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status is required");
        }

        Shipment shipment = shipmentRepository.findById(request.shipmentId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shipment not found"));

        shipmentWorkflowService.changeStatus(shipment, request.status());
        shipmentRepository.save(shipment);

        TrackingEvent event = new TrackingEvent();
        event.setShipment(shipment);
        event.setStatus(request.status().name());
        event.setLocationName(request.locationName());
        event.setDescription(request.description());
        event.setEventTime(LocalDateTime.now());

        TrackingEvent savedEvent = trackingEventRepository.save(event);
        return TrackingEventResponse.fromEntity(savedEvent);
    }

    public List<TrackingEventResponse> getHistory(UUID shipmentId) {
        if (!shipmentRepository.existsById(shipmentId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Shipment not found");
        }

        return trackingEventRepository.findAllByShipment_IdOrderByEventTimeDesc(shipmentId)
                .stream()
                .map(TrackingEventResponse::fromEntity)
                .toList();
    }

    public PublicShipmentTrackingResponse getPublicTracking(String trackingNumber) {
        // Znajdź przesyłkę po numerze
        Shipment shipment = shipmentRepository.findByTrackingNumber(trackingNumber)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nie znaleziono przesyłki: " + trackingNumber));

        // Pobierz historię
        List<PublicTrackingEventResponse> history = trackingEventRepository.findAllByShipment_IdOrderByEventTimeDesc(shipment.getId())
                .stream()
                .map(event -> new PublicTrackingEventResponse(
                        event.getStatus(),
                        event.getLocationName(),
                        event.getDescription(),
                        event.getEventTime()
                ))
                .toList();

        return new PublicShipmentTrackingResponse(
                shipment.getTrackingNumber(),
                shipment.getStatus(),
                shipment.getDeliveryType(),
                "Nadawca (zabezpieczone)",
                "Odbiorca (zabezpieczone)",
                history
        );
    }
}
