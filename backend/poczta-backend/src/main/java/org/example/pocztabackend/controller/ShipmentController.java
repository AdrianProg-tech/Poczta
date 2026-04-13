package org.example.pocztabackend.controller;

import org.example.pocztabackend.dto.ShipmentRequest;
import org.example.pocztabackend.dto.ShipmentResponse;
import org.example.pocztabackend.dto.ShipmentStatusUpdateRequest;
import org.example.pocztabackend.model.Shipment;
import org.example.pocztabackend.repository.ShipmentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/parcels")
public class ShipmentController {

    private final ShipmentRepository parcelRepository;

    public ShipmentController(ShipmentRepository parcelRepository) {
        this.parcelRepository = parcelRepository;
    }

    @GetMapping
    public List<ShipmentResponse> getAllParcels() {
        return parcelRepository.findAll().stream()
                .map(ShipmentResponse::fromEntity)
                .toList();
    }

    @GetMapping("/{id}")
    public ShipmentResponse getParcelById(@PathVariable UUID id) {
        return parcelRepository.findById(id)
                .map(ShipmentResponse::fromEntity)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Parcel not found"));
    }

    @GetMapping("/tracking/{trackingNumber}")
    public ShipmentResponse getParcelByTrackingNumber(@PathVariable String trackingNumber) {
        return parcelRepository.findByTrackingNumber(trackingNumber)
                .map(ShipmentResponse::fromEntity)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Parcel not found"));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ShipmentResponse createShipment(@RequestBody ShipmentRequest request) {
        if (!StringUtils.hasText(request.trackingNumber())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "trackingNumber is required");
        }
        if (request.status() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status is required");
        }
        if (parcelRepository.existsByTrackingNumber(request.trackingNumber())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "trackingNumber already exists");
        }

        Shipment parcel = new Shipment();
        parcel.setTrackingNumber(request.trackingNumber());
        parcel.setStatus(request.status());
        parcel.setSenderName(request.senderName());
        parcel.setSenderPhone(request.senderPhone());
        parcel.setRecipientName(request.recipientName());
        parcel.setRecipientPhone(request.recipientPhone());
        parcel.setDeliveryType(request.deliveryType());
        parcel.setWeight(request.weight());
        parcel.setSizeCategory(request.sizeCategory());
        parcel.setCreatedAt(LocalDateTime.now());

        return ShipmentResponse.fromEntity(parcelRepository.save(parcel));
    }

    @PatchMapping("/{id}/status")
    public ShipmentResponse updateParcelStatus(@PathVariable UUID id, @RequestBody ShipmentStatusUpdateRequest request) {
        if (request.status() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status is required");
        }

        Shipment shipment = parcelRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Parcel not found"));

        shipment.setStatus(request.status());
        return ShipmentResponse.fromEntity(parcelRepository.save(shipment));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteParcel(@PathVariable UUID id) {
        Shipment shipment = parcelRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Parcel not found"));

        parcelRepository.delete(shipment);
    }
}
