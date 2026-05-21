package org.example.pocztabackend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.example.pocztabackend.dto.AdminPaymentSummaryResponse;
import org.example.pocztabackend.dto.PaymentStateChangeResponse;
import org.example.pocztabackend.service.AdminPaymentContractService;
import org.example.pocztabackend.service.OperationalActorResolver;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/payments")
@Tag(name = "Płatności (admin)", description = "Zarządzanie statusami płatności przez administratora")
public class AdminPaymentContractController {

    private final AdminPaymentContractService adminPaymentContractService;
    private final OperationalActorResolver operationalActorResolver;

    public AdminPaymentContractController(
            AdminPaymentContractService adminPaymentContractService,
            OperationalActorResolver operationalActorResolver
    ) {
        this.adminPaymentContractService = adminPaymentContractService;
        this.operationalActorResolver = operationalActorResolver;
    }

    @GetMapping
    @Operation(summary = "Pobierz listę wszystkich płatności")
    public List<AdminPaymentSummaryResponse> listPayments() {
        operationalActorResolver.requireAdminActor(false);
        return adminPaymentContractService.listPayments();
    }

    @PostMapping("/{paymentId}/mark-paid")
    @Operation(summary = "Oznacz płatność jako opłaconą")
    public PaymentStateChangeResponse markPaid(@PathVariable UUID paymentId) {
        operationalActorResolver.requireAdminActor(false);
        return adminPaymentContractService.markPaid(paymentId);
    }

    @PostMapping("/{paymentId}/fail")
    @Operation(summary = "Oznacz płatność jako nieudaną")
    public PaymentStateChangeResponse failPayment(@PathVariable UUID paymentId) {
        operationalActorResolver.requireAdminActor(false);
        return adminPaymentContractService.failPayment(paymentId);
    }

    @PostMapping("/{paymentId}/cancel")
    @Operation(summary = "Anuluj płatność")
    public PaymentStateChangeResponse cancelPayment(@PathVariable UUID paymentId) {
        operationalActorResolver.requireAdminActor(false);
        return adminPaymentContractService.cancelPayment(paymentId);
    }
}
