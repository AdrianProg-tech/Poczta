package org.example.pocztabackend.controller;

import jakarta.validation.Valid;
import org.example.pocztabackend.dto.CreatePaymentRequest;
import org.example.pocztabackend.dto.PaymentCreatedResponse;
import org.example.pocztabackend.dto.PaymentSummaryResponse;
import org.example.pocztabackend.service.ClientPaymentContractService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/client")
public class ClientPaymentController {

    private final ClientPaymentContractService clientPaymentContractService;

    public ClientPaymentController(ClientPaymentContractService clientPaymentContractService) {
        this.clientPaymentContractService = clientPaymentContractService;
    }

    @PostMapping("/shipments/{trackingNumber}/payments")
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentCreatedResponse createPayment(
            @RequestHeader(name = "X-User-Email", required = false) String userEmail,
            @PathVariable String trackingNumber,
            @Valid @RequestBody CreatePaymentRequest request
    ) {
        return clientPaymentContractService.createPayment(userEmail, trackingNumber, request);
    }

    @GetMapping("/payments")
    public List<PaymentSummaryResponse> listPayments(
            @RequestHeader(name = "X-User-Email", required = false) String userEmail
    ) {
        return clientPaymentContractService.listPayments(userEmail);
    }
}
