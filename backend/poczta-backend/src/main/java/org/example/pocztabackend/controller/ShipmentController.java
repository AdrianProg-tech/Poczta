package org.example.pocztabackend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.example.pocztabackend.dto.ShipmentRequest;
import org.example.pocztabackend.dto.ShipmentResponse;
import org.example.pocztabackend.dto.ShipmentStatusUpdateRequest;
import org.example.pocztabackend.model.Shipment;
import org.example.pocztabackend.repository.ShipmentRepository;
import org.example.pocztabackend.service.ShipmentWorkflowService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/parcels")
@Tag(name = "Przesyłki (zarządzanie)", description = "Niskopoziomowe operacje CRUD na przesyłkach")
public class ShipmentController {

    private final ShipmentRepository parcelRepository;
    private final ShipmentWorkflowService shipmentWorkflowService;

    public ShipmentController(ShipmentRepository parcelRepository, ShipmentWorkflowService shipmentWorkflowService) {
        this.parcelRepository = parcelRepository;
        this.shipmentWorkflowService = shipmentWorkflowService;
    }

    @GetMapping
    @Operation(summary = "Pobierz wszystkie przesyłki")
    public List<ShipmentResponse> getAllParcels() {
        return parcelRepository.findAll().stream()
                .map(ShipmentResponse::fromEntity)
                .toList();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Pobierz przesyłkę po ID")
    public ShipmentResponse getParcelById(@PathVariable UUID id) {
        return parcelRepository.findById(id)
                .map(ShipmentResponse::fromEntity)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Parcel not found"));
    }

    @GetMapping("/tracking/{trackingNumber}")
    @Operation(summary = "Pobierz przesyłkę po numerze śledzenia")
    public ShipmentResponse getParcelByTrackingNumber(@PathVariable String trackingNumber) {
        return parcelRepository.findByTrackingNumber(trackingNumber)
                .map(ShipmentResponse::fromEntity)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Parcel not found"));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Utwórz przesyłkę (tryb zarządzania)")
    public ShipmentResponse createShipment(@Valid @RequestBody ShipmentRequest request) {
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
    @Operation(summary = "Zaktualizuj status przesyłki")
    public ShipmentResponse updateParcelStatus(@PathVariable UUID id, @Valid @RequestBody ShipmentStatusUpdateRequest request) {
        Shipment shipment = parcelRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Parcel not found"));

        shipmentWorkflowService.changeStatus(shipment, request.status());
        return ShipmentResponse.fromEntity(parcelRepository.save(shipment));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Usuń przesyłkę")
    public void deleteParcel(@PathVariable UUID id) {
        Shipment shipment = parcelRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Parcel not found"));

        try {
            parcelRepository.delete(shipment);
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Parcel cannot be deleted because it is referenced by other records"
            );
        }
    }
}
