package controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.example.pocztabackend.model.Shipment;
import repository.ShipmentRepository;

import java.util.List;

@RestController
@RequestMapping("/api/parcels") // Adres bazowy
public class ShipmentController {

    @Autowired
    private ShipmentRepository parcelRepository;

    // Pobieranie wszystkich paczek: GET http://localhost:8080/api/parcels
    @GetMapping
    public List<Shipment> getAllParcels() {
        return parcelRepository.findAll();
    }

    // Dodawanie nowej paczki: POST http://localhost:8080/api/parcels
    @PostMapping
    public Shipment createShipment(@RequestBody Shipment parcel) {
        return parcelRepository.save(parcel);
    }
}