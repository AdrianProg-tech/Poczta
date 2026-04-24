package org.example.pocztabackend.controller;

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
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentResponse createPayment(@Valid @RequestBody PaymentRequest request) {
        return paymentService.createPayment(request);
    }

    @GetMapping
    public List<PaymentResponse> getPayments(@RequestParam(required = false) UUID shipmentId) {
        return paymentService.getPayments(shipmentId);
    }

    @PatchMapping("/{paymentId}/confirm-offline")
    public PaymentResponse confirmOfflinePayment(@PathVariable UUID paymentId) {
        return paymentService.confirmOfflinePayment(paymentId);
    }
}
