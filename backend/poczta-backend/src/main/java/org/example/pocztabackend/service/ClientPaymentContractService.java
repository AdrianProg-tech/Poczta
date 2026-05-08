package org.example.pocztabackend.service;

import org.example.pocztabackend.dto.CreatePaymentRequest;
import org.example.pocztabackend.dto.PaymentCreatedResponse;
import org.example.pocztabackend.dto.PaymentRequest;
import org.example.pocztabackend.dto.PaymentResponse;
import org.example.pocztabackend.dto.PaymentSummaryResponse;
import org.example.pocztabackend.model.Shipment;
import org.example.pocztabackend.model.User;
import org.example.pocztabackend.repository.PaymentRepository;
import org.example.pocztabackend.repository.ShipmentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

@Service
public class ClientPaymentContractService {

    private final ShipmentRepository shipmentRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentService paymentService;
    private final AuthFacadeService authFacadeService;

    public ClientPaymentContractService(
            ShipmentRepository shipmentRepository,
            PaymentRepository paymentRepository,
            PaymentService paymentService,
            AuthFacadeService authFacadeService
    ) {
        this.shipmentRepository = shipmentRepository;
        this.paymentRepository = paymentRepository;
        this.paymentService = paymentService;
        this.authFacadeService = authFacadeService;
    }

    @Transactional
    public PaymentCreatedResponse createPayment(String userEmail, String trackingNumber, CreatePaymentRequest request) {
        User user = authFacadeService.requireUser(userEmail);
        Shipment shipment = shipmentRepository.findByTrackingNumberAndCreator_Id(trackingNumber, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shipment not found"));

        PaymentResponse payment = paymentService.createPayment(new PaymentRequest(
                shipment.getId(),
                request.amount(),
                request.method().trim().toUpperCase(Locale.ROOT)
        ));

        return new PaymentCreatedResponse(
                payment.id(),
                payment.status() == null ? null : payment.status().name(),
                payment.method(),
                payment.externalReference()
        );
    }

    public List<PaymentSummaryResponse> listPayments(String userEmail) {
        User user = authFacadeService.requireUser(userEmail);
        return paymentRepository.findAllByShipment_Creator_IdOrderByCreatedAtDesc(user.getId()).stream()
                .map(PaymentSummaryResponse::fromEntity)
                .toList();
    }
}
