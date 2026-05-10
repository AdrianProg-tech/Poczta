package org.example.pocztabackend.controller;

import jakarta.validation.Valid;
import org.example.pocztabackend.dto.ClientShipmentRedirectRequest;
import org.example.pocztabackend.dto.ClientShipmentRedirectResponse;
import org.example.pocztabackend.dto.ClientShipmentDetailsResponse;
import org.example.pocztabackend.dto.ClientShipmentListItemResponse;
import org.example.pocztabackend.dto.CreateClientShipmentRequest;
import org.example.pocztabackend.dto.ShipmentCreatedResponse;
import org.example.pocztabackend.service.ClientShipmentCommandService;
import org.example.pocztabackend.service.ContractShipmentQueryService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.util.List;

@RestController
@RequestMapping("/api/client/shipments")
public class ClientShipmentController {

    private final ClientShipmentCommandService clientShipmentCommandService;
    private final ContractShipmentQueryService contractShipmentQueryService;

    public ClientShipmentController(
            ClientShipmentCommandService clientShipmentCommandService,
            ContractShipmentQueryService contractShipmentQueryService
    ) {
        this.clientShipmentCommandService = clientShipmentCommandService;
        this.contractShipmentQueryService = contractShipmentQueryService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ShipmentCreatedResponse createShipment(
            @Valid @RequestBody CreateClientShipmentRequest request
    ) {
        return clientShipmentCommandService.createShipment(null, request);
    }

    @GetMapping
    public List<ClientShipmentListItemResponse> getClientShipments() {
        return contractShipmentQueryService.getClientShipments(null);
    }

    @GetMapping("/{trackingNumber}")
    public ClientShipmentDetailsResponse getShipmentDetails(
            @PathVariable String trackingNumber
    ) {
        return contractShipmentQueryService.getShipmentDetails(null, trackingNumber);
    }

    @PostMapping("/{trackingNumber}/redirect")
    public ClientShipmentRedirectResponse requestRedirect(
            @PathVariable String trackingNumber,
            @Valid @RequestBody ClientShipmentRedirectRequest request
    ) {
        return clientShipmentCommandService.requestRedirect(null, trackingNumber, request);
    }
}
