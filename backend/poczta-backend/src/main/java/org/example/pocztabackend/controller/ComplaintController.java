package org.example.pocztabackend.controller;

import org.example.pocztabackend.dto.ComplaintRequest;
import org.example.pocztabackend.dto.ComplaintResponse;
import org.example.pocztabackend.service.ComplaintService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

    private final ComplaintService complaintService;

    public ComplaintController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ComplaintResponse createComplaint(@RequestBody ComplaintRequest request) {
        return ComplaintResponse.fromEntity(complaintService.createComplaint(request));
    }

    // Tu w przyszłości dodasz np. pobieranie reklamacji: @GetMapping
}