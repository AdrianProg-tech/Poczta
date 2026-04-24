package org.example.pocztabackend.service;

import org.example.pocztabackend.dto.PaymentRequest;
import org.example.pocztabackend.dto.PaymentResponse;
import org.example.pocztabackend.model.Payment;
import org.example.pocztabackend.model.Shipment;
import org.example.pocztabackend.model.enums.PaymentStatus;
import org.example.pocztabackend.model.enums.ShipmentStatus;
import org.example.pocztabackend.repository.PaymentRepository;
import org.example.pocztabackend.repository.ShipmentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final ShipmentRepository shipmentRepository;
    private final ShipmentWorkflowService shipmentWorkflowService;

    public PaymentService(
            PaymentRepository paymentRepository,
            ShipmentRepository shipmentRepository,
            ShipmentWorkflowService shipmentWorkflowService
    ) {
        this.paymentRepository = paymentRepository;
        this.shipmentRepository = shipmentRepository;
        this.shipmentWorkflowService = shipmentWorkflowService;
    }

    @Transactional
    public PaymentResponse createPayment(PaymentRequest request) {
        if (request.shipmentId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "shipmentId is required");
        }
        if (request.amount() == null || request.amount().signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "amount must be greater than zero");
        }
        if (request.method() == null || request.method().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "method is required");
        }

        Shipment shipment = shipmentRepository.findById(request.shipmentId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shipment not found"));

        String method = request.method().trim().toUpperCase();
        PaymentStatus initialStatus = switch (method) {
            case "OFFLINE" -> PaymentStatus.OFFLINE_PENDING;
            case "ONLINE" -> PaymentStatus.PENDING;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported payment method");
        };

        Payment payment = new Payment();
        payment.setShipment(shipment);
        payment.setAmount(request.amount());
        payment.setMethod(method);
        payment.setStatus(initialStatus);
        payment.setCreatedAt(LocalDateTime.now());
        payment.setExternalReference(method + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());

        return PaymentResponse.fromEntity(paymentRepository.save(payment));
    }

    public List<PaymentResponse> getPayments(UUID shipmentId) {
        List<Payment> payments = shipmentId == null
                ? paymentRepository.findAll()
                : paymentRepository.findAllByShipment_Id(shipmentId);

        return payments.stream()
                .map(PaymentResponse::fromEntity)
                .toList();
    }

    @Transactional
    public PaymentResponse confirmOfflinePayment(UUID paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));

        if (payment.getStatus() != PaymentStatus.OFFLINE_PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only offline pending payments can be confirmed");
        }

        payment.setStatus(PaymentStatus.OFFLINE_CONFIRMED);

        Shipment shipment = payment.getShipment();
        shipmentWorkflowService.changeStatus(shipment, ShipmentStatus.PAID);
        shipmentRepository.save(shipment);

        return PaymentResponse.fromEntity(paymentRepository.save(payment));
    }
}
