package org.example.pocztabackend.controller;

import org.example.pocztabackend.model.Shipment;
import org.example.pocztabackend.repository.ShipmentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/parcels")
public class ShipmentController {

    private final ShipmentRepository parcelRepository;

    public ShipmentController(ShipmentRepository parcelRepository) {
        this.parcelRepository = parcelRepository;
    }

    @GetMapping
    public List<Shipment> getAllParcels() {
        return parcelRepository.findAll();
    }

    @PostMapping
    public Shipment createShipment(@RequestBody Shipment parcel) {
        if (!StringUtils.hasText(parcel.getTrackingNumber())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "trackingNumber is required");
        }
        if (parcel.getStatus() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status is required");
        }
        if (parcel.getCreatedAt() == null) {
            parcel.setCreatedAt(LocalDateTime.now());
        }
        return parcelRepository.save(parcel);
    }
}
