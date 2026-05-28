package org.example.pocztabackend.service;

import org.example.pocztabackend.model.Payment;
import org.example.pocztabackend.model.Shipment;
import org.example.pocztabackend.model.enums.PaymentStatus;
import org.example.pocztabackend.model.enums.ShipmentStatus;
import org.example.pocztabackend.repository.PaymentRepository;
import org.example.pocztabackend.repository.ShipmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StripeServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private ShipmentRepository shipmentRepository;

    @Mock
    private NotificationService notificationService;

    private StripeService stripeService;

    @BeforeEach
    void setUp() {
        stripeService = new StripeService(
                paymentRepository,
                shipmentRepository,
                new ShipmentWorkflowService(notificationService)
        );
    }

    @Test
    void shouldMoveCreatedShipmentToPaidWhenStripeConfirmsPayment() {
        Shipment shipment = new Shipment();
        shipment.setStatus(ShipmentStatus.CREATED);

        Payment payment = new Payment();
        payment.setShipment(shipment);
        payment.setStatus(PaymentStatus.PENDING);

        when(shipmentRepository.save(any(Shipment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        stripeService.markPaymentAndShipmentPaid(payment, "cs_test_123");

        assertEquals(PaymentStatus.PAID, payment.getStatus());
        assertEquals("cs_test_123", payment.getExternalReference());
        assertEquals(ShipmentStatus.PAID, shipment.getStatus());
        verify(shipmentRepository).save(shipment);
        verify(paymentRepository).save(payment);
    }

    @Test
    void shouldNotRewriteShipmentAlreadyInOperationalFlow() {
        Shipment shipment = new Shipment();
        shipment.setStatus(ShipmentStatus.READY_FOR_POSTING);

        Payment payment = new Payment();
        payment.setShipment(shipment);
        payment.setStatus(PaymentStatus.PENDING);

        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        stripeService.markPaymentAndShipmentPaid(payment, "cs_test_456");

        assertEquals(PaymentStatus.PAID, payment.getStatus());
        assertEquals(ShipmentStatus.READY_FOR_POSTING, shipment.getStatus());
        verify(shipmentRepository, never()).save(any(Shipment.class));
        verify(paymentRepository).save(payment);
    }
}
