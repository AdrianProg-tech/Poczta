package org.example.pocztabackend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.example.pocztabackend.dto.PaymentRequest;
import org.example.pocztabackend.dto.PaymentResponse;
import org.example.pocztabackend.service.PaymentService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
@Tag(name = "Płatności", description = "Niskopoziomowe operacje na płatnościach")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Utwórz płatność")
    public PaymentResponse createPayment(@Valid @RequestBody PaymentRequest request) {
        return paymentService.createPayment(request);
    }

    @GetMapping
    @Operation(summary = "Pobierz płatności (opcjonalnie filtruj po shipmentId)")
    public List<PaymentResponse> getPayments(@RequestParam(required = false) UUID shipmentId) {
        return paymentService.getPayments(shipmentId);
    }

    @PatchMapping("/{paymentId}/confirm-offline")
    @Operation(summary = "Potwierdź płatność offline")
    public PaymentResponse confirmOfflinePayment(@PathVariable UUID paymentId) {
        return paymentService.confirmOfflinePayment(paymentId);
    }
}
