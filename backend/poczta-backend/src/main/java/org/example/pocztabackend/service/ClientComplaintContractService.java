package org.example.pocztabackend.service;

import org.example.pocztabackend.dto.ComplaintCreatedResponse;
import org.example.pocztabackend.dto.ComplaintSummaryResponse;
import org.example.pocztabackend.dto.CreateComplaintRequest;
import org.example.pocztabackend.model.Complaint;
import org.example.pocztabackend.model.Shipment;
import org.example.pocztabackend.model.User;
import org.example.pocztabackend.model.enums.ComplaintStatus;
import org.example.pocztabackend.repository.ComplaintRepository;
import org.example.pocztabackend.repository.ShipmentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class ClientComplaintContractService {

    private final ComplaintRepository complaintRepository;
    private final ShipmentRepository shipmentRepository;
    private final AuthFacadeService authFacadeService;

    public ClientComplaintContractService(
            ComplaintRepository complaintRepository,
            ShipmentRepository shipmentRepository,
            AuthFacadeService authFacadeService
    ) {
        this.complaintRepository = complaintRepository;
        this.shipmentRepository = shipmentRepository;
        this.authFacadeService = authFacadeService;
    }

    @Transactional
    public ComplaintCreatedResponse createComplaint(String userEmail, CreateComplaintRequest request) {
        User user = authFacadeService.requireUser(userEmail);
        Shipment shipment = shipmentRepository.findByTrackingNumberAndCreator_Id(request.trackingNumber(), user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shipment not found"));

        Complaint complaint = new Complaint();
        complaint.setComplaintNumber("REK-" + LocalDateTime.now().getYear() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        complaint.setType(request.type().trim().toUpperCase());
        complaint.setDescription(request.description());
        complaint.setStatus(ComplaintStatus.SUBMITTED);
        complaint.setSubmittedAt(LocalDateTime.now());
        complaint.setShipment(shipment);
        complaint.setUser(user);

        Complaint saved = complaintRepository.save(complaint);
        return new ComplaintCreatedResponse(saved.getId(), saved.getComplaintNumber(), saved.getStatus().name());
    }

    public List<ComplaintSummaryResponse> listComplaints(String userEmail) {
        User user = authFacadeService.requireUser(userEmail);
        return complaintRepository.findAllByUser_IdOrderBySubmittedAtDesc(user.getId()).stream()
                .map(ComplaintSummaryResponse::fromEntity)
                .toList();
    }
}
