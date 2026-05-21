package org.example.pocztabackend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.example.pocztabackend.dto.OfflinePaymentConfirmedResponse;
import org.example.pocztabackend.dto.PointCheckoutResponse;
import org.example.pocztabackend.dto.PointQueueResponse;
import org.example.pocztabackend.dto.ShipmentStateChangeResponse;
import org.example.pocztabackend.service.PointOperationContractService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/point")
@Tag(name = "Operacje punktu", description = "Obsługa przesyłek i płatności w punkcie odbioru")
public class PointOperationContractController {

    private final PointOperationContractService pointOperationContractService;

    public PointOperationContractController(PointOperationContractService pointOperationContractService) {
        this.pointOperationContractService = pointOperationContractService;
    }

    @GetMapping("/queue")
    @Operation(summary = "Pobierz kolejkę przesyłek w punkcie")
    public PointQueueResponse getQueue() {
        return pointOperationContractService.getQueue(null);
    }

    @PostMapping("/shipments/{trackingNumber}/accept")
    @Operation(summary = "Przyjmij przesyłkę do punktu")
    public ShipmentStateChangeResponse acceptShipment(@PathVariable String trackingNumber) {
        return pointOperationContractService.acceptShipment(null, trackingNumber);
    }

    @PostMapping("/shipments/{trackingNumber}/post")
    @Operation(summary = "Nadaj przesyłkę z punktu")
    public ShipmentStateChangeResponse postShipment(@PathVariable String trackingNumber) {
        return pointOperationContractService.postShipment(null, trackingNumber);
    }

    @PostMapping("/shipments/{trackingNumber}/release")
    @Operation(summary = "Wydaj przesyłkę odbiorcy")
    public ShipmentStateChangeResponse releaseShipment(@PathVariable String trackingNumber) {
        return pointOperationContractService.releaseShipment(null, trackingNumber);
    }

    @PostMapping("/payments/{paymentId}/confirm-offline")
    @Operation(summary = "Potwierdź płatność gotówkową w punkcie")
    public OfflinePaymentConfirmedResponse confirmOfflinePayment(@PathVariable UUID paymentId) {
        return pointOperationContractService.confirmOfflinePayment(null, paymentId);
    }

    @PostMapping("/shipments/{trackingNumber}/collect-offline-and-release")
    @Operation(summary = "Pobierz gotówkę i wydaj przesyłkę w jednym kroku")
    public PointCheckoutResponse collectOfflinePaymentAndReleaseShipment(@PathVariable String trackingNumber) {
        return pointOperationContractService.collectOfflinePaymentAndReleaseShipment(null, trackingNumber);
    }
}
