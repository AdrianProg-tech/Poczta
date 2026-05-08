package org.example.pocztabackend.service;

import org.example.pocztabackend.dto.ShipmentStateChangeResponse;
import org.example.pocztabackend.model.Shipment;
import org.example.pocztabackend.model.TrackingEvent;
import org.example.pocztabackend.model.enums.ShipmentStatus;
import org.example.pocztabackend.repository.ShipmentRepository;
import org.example.pocztabackend.repository.TrackingEventRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AdminShipmentOperationsService {

    private final ShipmentRepository shipmentRepository;
    private final ShipmentWorkflowService shipmentWorkflowService;
    private final TrackingEventRepository trackingEventRepository;

    public AdminShipmentOperationsService(
            ShipmentRepository shipmentRepository,
            ShipmentWorkflowService shipmentWorkflowService,
            TrackingEventRepository trackingEventRepository
    ) {
        this.shipmentRepository = shipmentRepository;
        this.shipmentWorkflowService = shipmentWorkflowService;
        this.trackingEventRepository = trackingEventRepository;
    }

    @Transactional
    public ShipmentStateChangeResponse prepareForDispatch(UUID shipmentId) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shipment not found"));

        if (shipment.getStatus() != ShipmentStatus.PAID) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only paid shipments can be prepared for dispatch");
        }

        shipmentWorkflowService.changeStatus(shipment, ShipmentStatus.READY_FOR_POSTING);
        shipmentRepository.save(shipment);

        TrackingEvent event = new TrackingEvent();
        event.setShipment(shipment);
        event.setStatus(ShipmentStatus.READY_FOR_POSTING.name());
        event.setLocationName("Operations preparation");
        event.setDescription("Shipment prepared for dispatch by operations");
        event.setEventTime(LocalDateTime.now());
        trackingEventRepository.save(event);

        return new ShipmentStateChangeResponse(
                shipment.getTrackingNumber(),
                shipment.getStatus().name()
        );
    }
}
