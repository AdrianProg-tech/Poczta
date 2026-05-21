package org.example.pocztabackend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.example.pocztabackend.dto.ComplaintCreatedResponse;
import org.example.pocztabackend.dto.ComplaintSummaryResponse;
import org.example.pocztabackend.dto.CreateComplaintRequest;
import org.example.pocztabackend.service.ClientComplaintContractService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/client/complaints")
@Tag(name = "Reklamacje (klient)", description = "Składanie i przeglądanie reklamacji przez klienta")
public class ClientComplaintController {

    private final ClientComplaintContractService clientComplaintContractService;

    public ClientComplaintController(ClientComplaintContractService clientComplaintContractService) {
        this.clientComplaintContractService = clientComplaintContractService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Złóż reklamację")
    public ComplaintCreatedResponse createComplaint(
            @Valid @RequestBody CreateComplaintRequest request
    ) {
        return clientComplaintContractService.createComplaint(null, request);
    }

    @GetMapping
    @Operation(summary = "Pobierz listę reklamacji klienta")
    public List<ComplaintSummaryResponse> listComplaints() {
        return clientComplaintContractService.listComplaints(null);
    }
}
