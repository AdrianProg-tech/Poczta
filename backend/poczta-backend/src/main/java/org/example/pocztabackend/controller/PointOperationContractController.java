package org.example.pocztabackend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.UUID;
import org.example.pocztabackend.dto.OfflinePaymentConfirmedResponse;
import org.example.pocztabackend.dto.PointCheckoutResponse;
import org.example.pocztabackend.dto.PointQueueResponse;
import org.example.pocztabackend.dto.ShipmentStateChangeResponse;
import org.example.pocztabackend.service.PointOperationContractService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/point")
@Tag(name = "Operacje punktu", description = "Obsluga przesylek i platnosci w punkcie odbioru")
public class PointOperationContractController {

    private final PointOperationContractService pointOperationContractService;

    public PointOperationContractController(PointOperationContractService pointOperationContractService) {
        this.pointOperationContractService = pointOperationContractService;
    }

    @GetMapping("/queue")
    @Operation(summary = "Pobierz kolejke przesylek w punkcie")
    public PointQueueResponse getQueue(
            @RequestHeader(name = "X-User-Email", required = false) String userEmailHeader
    ) {
        return pointOperationContractService.getQueue(userEmailHeader);
    }

    @PostMapping("/shipments/{trackingNumber}/accept")
    @Operation(summary = "Przyjmij przesylke do punktu")
    public ShipmentStateChangeResponse acceptShipment(
            @RequestHeader(name = "X-User-Email", required = false) String userEmailHeader,
            @PathVariable String trackingNumber
    ) {
        return pointOperationContractService.acceptShipment(userEmailHeader, trackingNumber);
    }

    @PostMapping("/shipments/{trackingNumber}/post")
    @Operation(summary = "Nadaj przesylke z punktu")
    public ShipmentStateChangeResponse postShipment(
            @RequestHeader(name = "X-User-Email", required = false) String userEmailHeader,
            @PathVariable String trackingNumber
    ) {
        return pointOperationContractService.postShipment(userEmailHeader, trackingNumber);
    }

    @PostMapping("/shipments/{trackingNumber}/release")
    @Operation(summary = "Wydaj przesylke odbiorcy")
    public ShipmentStateChangeResponse releaseShipment(
            @RequestHeader(name = "X-User-Email", required = false) String userEmailHeader,
            @PathVariable String trackingNumber
    ) {
        return pointOperationContractService.releaseShipment(userEmailHeader, trackingNumber);
    }

    @PostMapping("/payments/{paymentId}/confirm-offline")
    @Operation(summary = "Potwierdz platnosc gotowkowa w punkcie")
    public OfflinePaymentConfirmedResponse confirmOfflinePayment(
            @RequestHeader(name = "X-User-Email", required = false) String userEmailHeader,
            @PathVariable UUID paymentId
    ) {
        return pointOperationContractService.confirmOfflinePayment(userEmailHeader, paymentId);
    }

    @PostMapping("/shipments/{trackingNumber}/collect-offline-and-release")
    @Operation(summary = "Pobierz gotowke i wydaj przesylke w jednym kroku")
    public PointCheckoutResponse collectOfflinePaymentAndReleaseShipment(
            @RequestHeader(name = "X-User-Email", required = false) String userEmailHeader,
            @PathVariable String trackingNumber
    ) {
        return pointOperationContractService.collectOfflinePaymentAndReleaseShipment(userEmailHeader, trackingNumber);
    }
}
