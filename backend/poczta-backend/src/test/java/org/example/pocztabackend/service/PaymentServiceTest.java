package org.example.pocztabackend.service;

import org.example.pocztabackend.dto.PaymentRequest;
import org.example.pocztabackend.dto.PaymentResponse;
import org.example.pocztabackend.model.Payment;
import org.example.pocztabackend.model.Shipment;
import org.example.pocztabackend.model.enums.PaymentStatus;
import org.example.pocztabackend.model.enums.ShipmentStatus;
import org.example.pocztabackend.repository.PaymentRepository;
import org.example.pocztabackend.repository.ShipmentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private ShipmentRepository shipmentRepository;

    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        paymentService = new PaymentService(
                paymentRepository,
                shipmentRepository,
                new ShipmentWorkflowService()
        );
    }

    @Test
    void shouldCreateOfflinePaymentWithOfflinePendingStatus() {
        UUID shipmentId = UUID.randomUUID();
        Shipment shipment = new Shipment();
        shipment.setId(shipmentId);
        shipment.setStatus(ShipmentStatus.CREATED);

        when(shipmentRepository.findById(shipmentId)).thenReturn(Optional.of(shipment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentResponse response = paymentService.createPayment(
                new PaymentRequest(shipmentId, BigDecimal.valueOf(29.99), "OFFLINE")
        );

        assertEquals(PaymentStatus.OFFLINE_PENDING, response.status());
        assertEquals("OFFLINE", response.method());
        assertEquals(shipmentId, response.shipmentId());
        assertNotNull(response.externalReference());
    }

    @Test
    void shouldConfirmOfflinePaymentAndMoveShipmentToPaid() {
        UUID paymentId = UUID.randomUUID();
        UUID shipmentId = UUID.randomUUID();

        Shipment shipment = new Shipment();
        shipment.setId(shipmentId);
        shipment.setStatus(ShipmentStatus.CREATED);

        Payment payment = new Payment();
        payment.setId(paymentId);
        payment.setShipment(shipment);
        payment.setStatus(PaymentStatus.OFFLINE_PENDING);
        payment.setMethod("OFFLINE");

        when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(shipmentRepository.save(any(Shipment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentResponse response = paymentService.confirmOfflinePayment(paymentId);

        assertEquals(PaymentStatus.OFFLINE_CONFIRMED, response.status());
        assertEquals(ShipmentStatus.PAID, shipment.getStatus());

        ArgumentCaptor<Shipment> shipmentCaptor = ArgumentCaptor.forClass(Shipment.class);
        verify(shipmentRepository).save(shipmentCaptor.capture());
        assertEquals(ShipmentStatus.PAID, shipmentCaptor.getValue().getStatus());
    }

    @Test
    void shouldRejectOfflineConfirmationForWrongPaymentStatus() {
        UUID paymentId = UUID.randomUUID();

        Payment payment = new Payment();
        payment.setId(paymentId);
        payment.setStatus(PaymentStatus.PENDING);

        when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(payment));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> paymentService.confirmOfflinePayment(paymentId)
        );

        assertEquals(400, exception.getStatusCode().value());
    }
}
