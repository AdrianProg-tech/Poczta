package org.example.pocztabackend.service;

import org.example.pocztabackend.dto.AdminPaymentSummaryResponse;
import org.example.pocztabackend.dto.PaymentStateChangeResponse;
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

import java.util.List;
import java.util.UUID;

@Service
public class AdminPaymentContractService {

    private final PaymentRepository paymentRepository;
    private final ShipmentRepository shipmentRepository;
    private final ShipmentWorkflowService shipmentWorkflowService;

    public AdminPaymentContractService(
            PaymentRepository paymentRepository,
            ShipmentRepository shipmentRepository,
            ShipmentWorkflowService shipmentWorkflowService
    ) {
        this.paymentRepository = paymentRepository;
        this.shipmentRepository = shipmentRepository;
        this.shipmentWorkflowService = shipmentWorkflowService;
    }

    public List<AdminPaymentSummaryResponse> listPayments() {
        return paymentRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(AdminPaymentSummaryResponse::fromEntity)
                .toList();
    }

    @Transactional
    public PaymentStateChangeResponse markPaid(UUID paymentId) {
        Payment payment = getPayment(paymentId);
        if (payment.getStatus() != PaymentStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only pending online payments can be marked as paid");
        }

        payment.setStatus(PaymentStatus.PAID);
        Shipment shipment = payment.getShipment();
        if (shipment != null && shipment.getStatus() != ShipmentStatus.PAID) {
            shipmentWorkflowService.changeStatus(shipment, ShipmentStatus.PAID);
            shipmentRepository.save(shipment);
        }
        paymentRepository.save(payment);
        return toResponse(payment);
    }

    @Transactional
    public PaymentStateChangeResponse failPayment(UUID paymentId) {
        Payment payment = getPayment(paymentId);
        if (payment.getStatus() != PaymentStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only pending online payments can be marked as failed");
        }

        payment.setStatus(PaymentStatus.FAILED);
        paymentRepository.save(payment);
        return toResponse(payment);
    }

    @Transactional
    public PaymentStateChangeResponse cancelPayment(UUID paymentId) {
        Payment payment = getPayment(paymentId);
        if (payment.getStatus() != PaymentStatus.PENDING && payment.getStatus() != PaymentStatus.OFFLINE_PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only pending payments can be canceled");
        }

        payment.setStatus(PaymentStatus.CANCELED);
        paymentRepository.save(payment);
        return toResponse(payment);
    }

    private Payment getPayment(UUID paymentId) {
        return paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
    }

    private PaymentStateChangeResponse toResponse(Payment payment) {
        return new PaymentStateChangeResponse(
                payment.getId(),
                payment.getStatus() == null ? null : payment.getStatus().name(),
                payment.getShipment() == null || payment.getShipment().getStatus() == null
                        ? null
                        : payment.getShipment().getStatus().name()
        );
    }
}
