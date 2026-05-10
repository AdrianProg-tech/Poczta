package org.example.pocztabackend.controller;

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
public class PointOperationContractController {

    private final PointOperationContractService pointOperationContractService;

    public PointOperationContractController(PointOperationContractService pointOperationContractService) {
        this.pointOperationContractService = pointOperationContractService;
    }

    @GetMapping("/queue")
    public PointQueueResponse getQueue() {
        return pointOperationContractService.getQueue(null);
    }

    @PostMapping("/shipments/{trackingNumber}/accept")
    public ShipmentStateChangeResponse acceptShipment(@PathVariable String trackingNumber) {
        return pointOperationContractService.acceptShipment(null, trackingNumber);
    }

    @PostMapping("/shipments/{trackingNumber}/post")
    public ShipmentStateChangeResponse postShipment(@PathVariable String trackingNumber) {
        return pointOperationContractService.postShipment(null, trackingNumber);
    }

    @PostMapping("/shipments/{trackingNumber}/release")
    public ShipmentStateChangeResponse releaseShipment(@PathVariable String trackingNumber) {
        return pointOperationContractService.releaseShipment(null, trackingNumber);
    }

    @PostMapping("/payments/{paymentId}/confirm-offline")
    public OfflinePaymentConfirmedResponse confirmOfflinePayment(@PathVariable UUID paymentId) {
        return pointOperationContractService.confirmOfflinePayment(null, paymentId);
    }

    @PostMapping("/shipments/{trackingNumber}/collect-offline-and-release")
    public PointCheckoutResponse collectOfflinePaymentAndReleaseShipment(@PathVariable String trackingNumber) {
        return pointOperationContractService.collectOfflinePaymentAndReleaseShipment(null, trackingNumber);
    }
}
