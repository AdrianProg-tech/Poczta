package controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import model.Parcel;
import repository.ParcelRepository;

import java.util.List;

@RestController
@RequestMapping("/api/parcels") // Adres bazowy
public class ParcelController {

    @Autowired
    private ParcelRepository parcelRepository;

    // Pobieranie wszystkich paczek: GET http://localhost:8080/api/parcels
    @GetMapping
    public List<Parcel> getAllParcels() {
        return parcelRepository.findAll();
    }

    // Dodawanie nowej paczki: POST http://localhost:8080/api/parcels
    @PostMapping
    public Parcel createParcel(@RequestBody Parcel parcel) {
        return parcelRepository.save(parcel);
    }
}