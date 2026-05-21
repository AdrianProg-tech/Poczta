package org.example.pocztabackend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.example.pocztabackend.dto.CreatePaymentRequest;
import org.example.pocztabackend.dto.PaymentCreatedResponse;
import org.example.pocztabackend.dto.PaymentSummaryResponse;
import org.example.pocztabackend.dto.StripeCheckoutResponse;
import org.example.pocztabackend.service.ClientPaymentContractService;
import org.example.pocztabackend.service.StripeService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/client")
@Tag(name = "Płatności (klient)", description = "Zarządzanie płatnościami — tworzenie, lista, płatność online Stripe")
public class ClientPaymentController {

    private final ClientPaymentContractService clientPaymentContractService;
    private final StripeService stripeService;

    public ClientPaymentController(ClientPaymentContractService clientPaymentContractService,
                                   StripeService stripeService) {
        this.clientPaymentContractService = clientPaymentContractService;
        this.stripeService = stripeService;
    }

    @PostMapping("/shipments/{trackingNumber}/payments")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Utwórz płatność dla przesyłki")
    public PaymentCreatedResponse createPayment(
            @PathVariable String trackingNumber,
            @Valid @RequestBody CreatePaymentRequest request
    ) {
        return clientPaymentContractService.createPayment(null, trackingNumber, request);
    }

    @GetMapping("/payments")
    @Operation(summary = "Pobierz listę płatności klienta")
    public List<PaymentSummaryResponse> listPayments() {
        return clientPaymentContractService.listPayments(null);
    }

    @PostMapping("/payments/{paymentId}/initiate-online")
    @Operation(summary = "Zainicjuj płatność online przez Stripe — zwraca URL do checkout")
    public StripeCheckoutResponse initiateOnlinePayment(@PathVariable UUID paymentId) {
        String checkoutUrl = stripeService.createCheckoutSession(paymentId);
        return new StripeCheckoutResponse(checkoutUrl);
    }

    @PostMapping("/payments/{paymentId}/verify-session")
    @Operation(summary = "Zweryfikuj sesję Stripe po powrocie z checkout")
    public java.util.Map<String, String> verifyStripeSession(
            @PathVariable UUID paymentId,
            @org.springframework.web.bind.annotation.RequestParam String sessionId
    ) {
        String status = stripeService.verifySession(paymentId, sessionId);
        return java.util.Map.of("status", status);
    }
}
