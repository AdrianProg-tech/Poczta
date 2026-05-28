package org.example.pocztabackend.service;

import org.example.pocztabackend.dto.CompleteDeliveryRequest;
import org.example.pocztabackend.dto.CourierTaskStateChangeResponse;
import org.example.pocztabackend.dto.PaymentResponse;
import org.example.pocztabackend.model.CourierTask;
import org.example.pocztabackend.model.Payment;
import org.example.pocztabackend.model.Shipment;
import org.example.pocztabackend.model.TrackingEvent;
import org.example.pocztabackend.model.User;
import org.example.pocztabackend.model.enums.PaymentStatus;
import org.example.pocztabackend.model.enums.ShipmentNodeType;
import org.example.pocztabackend.model.enums.ShipmentRouteStatus;
import org.example.pocztabackend.model.enums.ShipmentStatus;
import org.example.pocztabackend.repository.CourierTaskRepository;
import org.example.pocztabackend.repository.DeliveryAttemptRepository;
import org.example.pocztabackend.repository.NoticeRepository;
import org.example.pocztabackend.repository.PaymentRepository;
import org.example.pocztabackend.repository.PointRepository;
import org.example.pocztabackend.repository.ReturnProcessRepository;
import org.example.pocztabackend.repository.ShipmentRepository;
import org.example.pocztabackend.repository.TrackingEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CourierTaskContractServiceTest {

    @Mock
    private CourierTaskRepository courierTaskRepository;

    @Mock
    private ShipmentRepository shipmentRepository;

    @Mock
    private TrackingEventRepository trackingEventRepository;

    @Mock
    private DeliveryAttemptRepository deliveryAttemptRepository;

    @Mock
    private PointRepository pointRepository;

    @Mock
    private OperationalActorResolver operationalActorResolver;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private PaymentService paymentService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private NoticeRepository noticeRepository;

    @Mock
    private ReturnProcessRepository returnProcessRepository;

    private CourierTaskContractService courierTaskContractService;

    @BeforeEach
    void setUp() {
        courierTaskContractService = new CourierTaskContractService(
                courierTaskRepository,
                shipmentRepository,
                trackingEventRepository,
                new ShipmentWorkflowService(notificationService),
                deliveryAttemptRepository,
                pointRepository,
                operationalActorResolver,
                paymentRepository,
                paymentService,
                noticeRepository,
                returnProcessRepository,
                new ShipmentRoutingService()
        );
    }

    @Test
    void shouldRequireCourierPaymentCollectionBeforeCompletingDelivery() {
        User courier = new User();
        courier.setId(UUID.randomUUID());
        courier.setEmail("courier@example.com");

        Shipment shipment = new Shipment();
        shipment.setId(UUID.randomUUID());
        shipment.setStatus(ShipmentStatus.OUT_FOR_DELIVERY);
        shipment.setTrackingNumber("PWCOURIER1PL");
        shipment.setDeliveryType("COURIER");
        shipment.setDeliveryMethod("COURIER_HOME");
        shipment.setShipmentRouteStatus(ShipmentRouteStatus.OUT_FOR_DELIVERY.name());
        shipment.setCurrentNodeType(ShipmentNodeType.COURIER.name());

        CourierTask task = new CourierTask();
        task.setId(UUID.randomUUID());
        task.setCourier(courier);
        task.setShipment(shipment);
        task.setStatus("IN_PROGRESS");

        Payment payment = new Payment();
        payment.setId(UUID.randomUUID());
        payment.setShipment(shipment);
        payment.setMethod("OFFLINE_AT_COURIER");
        payment.setStatus(PaymentStatus.OFFLINE_PENDING);

        when(operationalActorResolver.requireCourierActor(null)).thenReturn(courier);
        when(courierTaskRepository.findById(task.getId())).thenReturn(Optional.of(task));
        when(paymentRepository.findAllByShipment_IdOrderByCreatedAtDesc(shipment.getId())).thenReturn(List.of(payment));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> courierTaskContractService.completeDelivery(
                        null,
                        task.getId(),
                        new CompleteDeliveryRequest(LocalDateTime.now(), "No cash flow", false, null)
                )
        );

        assertEquals(409, exception.getStatusCode().value());
        verify(paymentService, never()).confirmOfflinePayment(any(), any());
    }

    @Test
    void shouldCollectCourierPaymentAndCompleteDelivery() {
        User courier = new User();
        courier.setId(UUID.randomUUID());
        courier.setEmail("courier@example.com");

        Shipment shipment = new Shipment();
        shipment.setId(UUID.randomUUID());
        shipment.setStatus(ShipmentStatus.OUT_FOR_DELIVERY);
        shipment.setTrackingNumber("PWCOURIER2PL");
        shipment.setDeliveryType("COURIER");
        shipment.setDeliveryMethod("COURIER_HOME");
        shipment.setShipmentRouteStatus(ShipmentRouteStatus.OUT_FOR_DELIVERY.name());
        shipment.setCurrentNodeType(ShipmentNodeType.COURIER.name());

        CourierTask task = new CourierTask();
        task.setId(UUID.randomUUID());
        task.setCourier(courier);
        task.setShipment(shipment);
        task.setStatus("IN_PROGRESS");

        Payment payment = new Payment();
        payment.setId(UUID.randomUUID());
        payment.setShipment(shipment);
        payment.setAmount(BigDecimal.valueOf(24.99));
        payment.setMethod("OFFLINE_AT_COURIER");
        payment.setStatus(PaymentStatus.OFFLINE_PENDING);

        when(operationalActorResolver.requireCourierActor(null)).thenReturn(courier);
        when(courierTaskRepository.findById(task.getId())).thenReturn(Optional.of(task));
        when(paymentRepository.findAllByShipment_IdOrderByCreatedAtDesc(shipment.getId())).thenReturn(List.of(payment));
        when(paymentService.confirmOfflinePayment(payment.getId(), "CARD")).thenReturn(
                new PaymentResponse(
                        payment.getId(),
                        shipment.getId(),
                        payment.getAmount(),
                        payment.getMethod(),
                        PaymentStatus.OFFLINE_CONFIRMED,
                        "CARD",
                        "OFFLINE_AT_COURIER-TEST",
                        LocalDateTime.now()
                )
        );
        when(shipmentRepository.save(any(Shipment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(courierTaskRepository.save(any(CourierTask.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CourierTaskStateChangeResponse response = courierTaskContractService.completeDelivery(
                null,
                task.getId(),
                new CompleteDeliveryRequest(LocalDateTime.now(), "Paid at door", true, "CARD")
        );

        assertEquals("COMPLETED", response.taskStatus());
        assertEquals(ShipmentStatus.DELIVERED, shipment.getStatus());

        ArgumentCaptor<TrackingEvent> trackingEventCaptor = ArgumentCaptor.forClass(TrackingEvent.class);
        verify(trackingEventRepository).save(trackingEventCaptor.capture());
        assertEquals(ShipmentStatus.DELIVERED.name(), trackingEventCaptor.getValue().getStatus());
        verify(paymentService).confirmOfflinePayment(payment.getId(), "CARD");
    }
}
