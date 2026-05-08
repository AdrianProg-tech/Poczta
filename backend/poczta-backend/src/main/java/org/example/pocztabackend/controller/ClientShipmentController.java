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
import org.springframework.web.bind.annotation.RequestHeader;
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
            @RequestHeader(name = "X-User-Email", required = false) String userEmail,
            @Valid @RequestBody CreateClientShipmentRequest request
    ) {
        return clientShipmentCommandService.createShipment(userEmail, request);
    }

    @GetMapping
    public List<ClientShipmentListItemResponse> getClientShipments(
            @RequestHeader(name = "X-User-Email", required = false) String userEmail
    ) {
        return contractShipmentQueryService.getClientShipments(userEmail);
    }

    @GetMapping("/{trackingNumber}")
    public ClientShipmentDetailsResponse getShipmentDetails(
            @RequestHeader(name = "X-User-Email", required = false) String userEmail,
            @PathVariable String trackingNumber
    ) {
        return contractShipmentQueryService.getShipmentDetails(userEmail, trackingNumber);
    }

    @PostMapping("/{trackingNumber}/redirect")
    public ClientShipmentRedirectResponse requestRedirect(
            @RequestHeader(name = "X-User-Email", required = false) String userEmail,
            @PathVariable String trackingNumber,
            @Valid @RequestBody ClientShipmentRedirectRequest request
    ) {
        return clientShipmentCommandService.requestRedirect(userEmail, trackingNumber, request);
    }
}
