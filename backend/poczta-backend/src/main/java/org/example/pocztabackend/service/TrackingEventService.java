package org.example.pocztabackend.service;

import lombok.RequiredArgsConstructor;
import org.example.pocztabackend.dto.TrackingEventRequest;
import org.example.pocztabackend.dto.TrackingEventResponse;
import org.example.pocztabackend.model.Shipment;
import org.example.pocztabackend.model.TrackingEvent;
import org.example.pocztabackend.model.enums.ShipmentStatus;
import org.example.pocztabackend.repository.ShipmentRepository;
import org.example.pocztabackend.repository.TrackingEventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TrackingEventService {

    private final TrackingEventRepository trackingEventRepository;
    private final ShipmentRepository shipmentRepository;

    @Transactional // Zapewnia, że jeśli coś pęknie, wycofamy zmiany w obu tabelach
    public TrackingEventResponse addEvent(TrackingEventRequest request) {
        // 1. Znajdź paczkę w bazie
        Shipment shipment = shipmentRepository.findById(request.shipmentId())
                .orElseThrow(() -> new RuntimeException("Nie znaleziono paczki o ID: " + request.shipmentId()));

        // 2. Zaktualizuj główny status paczki
        shipment.setStatus(ShipmentStatus.valueOf(request.status()));
        shipmentRepository.save(shipment);

        // 3. Utwórz i zapisz nowe zdarzenie w historii (Tracking)
        TrackingEvent event = TrackingEvent.builder()
                .shipment(shipment)
                .status(request.status())
                .locationName(request.locationName())
                .description(request.description())
                .eventTime(LocalDateTime.now())
                .build();

        TrackingEvent savedEvent = trackingEventRepository.save(event);

        return TrackingEventResponse.fromEntity(savedEvent);
    }

    // Pobieranie całej historii śledzenia dla danej paczki
    public List<TrackingEventResponse> getHistory(UUID shipmentId) {
        return trackingEventRepository.findAllByShipment_IdOrderByEventTimeDesc(shipmentId)
                .stream()
                .map(TrackingEventResponse::fromEntity)
                .toList();
    }
}