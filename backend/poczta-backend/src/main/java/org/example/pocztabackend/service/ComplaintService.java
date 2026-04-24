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
import java.util.List;
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
        if (request.shipmentId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "shipmentId is required");
        }
        if (request.userId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "userId is required");
        }
        if (request.type() == null || request.type().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "type is required");
        }

        Shipment shipment = shipmentRepository.findById(request.shipmentId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shipment not found"));

        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        String generatedNumber = "REK-" + LocalDateTime.now().getYear() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Complaint newComplaint = new Complaint();
        newComplaint.setComplaintNumber(generatedNumber);
        newComplaint.setType(request.type());
        newComplaint.setDescription(request.description());
        newComplaint.setStatus(ComplaintStatus.SUBMITTED);
        newComplaint.setSubmittedAt(LocalDateTime.now());
        newComplaint.setShipment(shipment);
        newComplaint.setUser(user);

        return complaintRepository.save(newComplaint);
    }

    public List<Complaint> getComplaints(UUID shipmentId, UUID userId) {
        if (shipmentId != null) {
            return complaintRepository.findAllByShipment_Id(shipmentId);
        }
        if (userId != null) {
            return complaintRepository.findAllByUser_Id(userId);
        }
        return complaintRepository.findAll();
    }
}
