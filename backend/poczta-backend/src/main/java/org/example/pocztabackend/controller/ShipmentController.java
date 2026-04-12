package org.example.pocztabackend.controller;

import org.example.pocztabackend.model.Shipment;
import org.example.pocztabackend.repository.ShipmentRepository;
import org.springframework.web.bind.annotation.*;

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
        return parcelRepository.save(parcel);
    }
}