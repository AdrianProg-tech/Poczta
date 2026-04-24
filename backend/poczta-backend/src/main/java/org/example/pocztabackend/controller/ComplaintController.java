package org.example.pocztabackend.controller;

import jakarta.validation.Valid;
import org.example.pocztabackend.dto.ComplaintRequest;
import org.example.pocztabackend.dto.ComplaintResponse;
import org.example.pocztabackend.service.ComplaintService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

    private final ComplaintService complaintService;

    public ComplaintController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ComplaintResponse createComplaint(@Valid @RequestBody ComplaintRequest request) {
        return ComplaintResponse.fromEntity(complaintService.createComplaint(request));
    }

    @GetMapping
    public List<ComplaintResponse> getComplaints(
            @RequestParam(required = false) UUID shipmentId,
            @RequestParam(required = false) UUID userId
    ) {
        return complaintService.getComplaints(shipmentId, userId).stream()
                .map(ComplaintResponse::fromEntity)
                .toList();
    }
}
