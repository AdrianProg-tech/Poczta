package org.example.pocztabackend.controller;

import org.example.pocztabackend.dto.OfflinePaymentConfirmedResponse;
import org.example.pocztabackend.dto.PointQueueResponse;
import org.example.pocztabackend.dto.ShipmentStateChangeResponse;
import org.example.pocztabackend.service.PointOperationContractService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
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
    public PointQueueResponse getQueue(
            @RequestHeader(name = "X-Point-Code", required = false) String pointCode
    ) {
        return pointOperationContractService.getQueue(pointCode);
    }

    @PostMapping("/shipments/{trackingNumber}/accept")
    public ShipmentStateChangeResponse acceptShipment(
            @RequestHeader(name = "X-Point-Code", required = false) String pointCode,
            @PathVariable String trackingNumber
    ) {
        return pointOperationContractService.acceptShipment(pointCode, trackingNumber);
    }

    @PostMapping("/shipments/{trackingNumber}/post")
    public ShipmentStateChangeResponse postShipment(
            @RequestHeader(name = "X-Point-Code", required = false) String pointCode,
            @PathVariable String trackingNumber
    ) {
        return pointOperationContractService.postShipment(pointCode, trackingNumber);
    }

    @PostMapping("/shipments/{trackingNumber}/release")
    public ShipmentStateChangeResponse releaseShipment(
            @RequestHeader(name = "X-Point-Code", required = false) String pointCode,
            @PathVariable String trackingNumber
    ) {
        return pointOperationContractService.releaseShipment(pointCode, trackingNumber);
    }

    @PostMapping("/payments/{paymentId}/confirm-offline")
    public OfflinePaymentConfirmedResponse confirmOfflinePayment(
            @RequestHeader(name = "X-Point-Code", required = false) String pointCode,
            @PathVariable UUID paymentId
    ) {
        return pointOperationContractService.confirmOfflinePayment(pointCode, paymentId);
    }
}
