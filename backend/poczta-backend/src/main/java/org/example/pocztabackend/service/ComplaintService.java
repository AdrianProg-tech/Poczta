package org.example.pocztabackend.service;

import org.example.pocztabackend.dto.ComplaintRequest;
import org.example.pocztabackend.model.Complaint;
import org.example.pocztabackend.model.Shipment;
import org.example.pocztabackend.model.User;
import org.example.pocztabackend.model.enums.ComplaintStatus;
import org.example.pocztabackend.repository.ComplaintRepository;
import org.example.pocztabackend.repository.ShipmentRepository;
import org.example.pocztabackend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final ShipmentRepository shipmentRepository;
    private final UserRepository userRepository;

    public ComplaintService(ComplaintRepository complaintRepository, ShipmentRepository shipmentRepository, UserRepository userRepository) {
        this.complaintRepository = complaintRepository;
        this.shipmentRepository = shipmentRepository;
        this.userRepository = userRepository;
    }

    public Complaint createComplaint(ComplaintRequest request) {
        // 1. Sprawdzamy, czy paczka istnieje
        Shipment shipment = shipmentRepository.findById(request.shipmentId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nie znaleziono przesyłki"));

        // 2. Sprawdzamy, czy użytkownik istnieje
        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nie znaleziono użytkownika"));

        // 3. Generujemy unikalny numer reklamacji
        String generatedNumber = "REK-" + LocalDateTime.now().getYear() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // 4. Budujemy nowy obiekt reklamacji
        Complaint newComplaint = Complaint.builder()
                .complaintNumber(generatedNumber)
                .type(request.type())
                .description(request.description())
                .status(ComplaintStatus.SUBMITTED) // <--- Używamy Twojego statusu!
                .submittedAt(LocalDateTime.now())
                .shipment(shipment)
                .user(user)
                .build();

        // 5. Zapisujemy w bazie
        return complaintRepository.save(newComplaint);
    }
}