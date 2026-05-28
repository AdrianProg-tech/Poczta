package org.example.pocztabackend.service;

import org.example.pocztabackend.dto.PointCheckoutResponse;
import org.example.pocztabackend.dto.PointQueueResponse;
import org.example.pocztabackend.model.Payment;
import org.example.pocztabackend.model.Point;
import org.example.pocztabackend.model.Shipment;
import org.example.pocztabackend.model.TrackingEvent;
import org.example.pocztabackend.model.enums.ShipmentNodeType;
import org.example.pocztabackend.model.enums.ShipmentRouteStatus;
import org.example.pocztabackend.model.enums.PaymentStatus;
import org.example.pocztabackend.model.enums.ShipmentStatus;
import org.example.pocztabackend.repository.PaymentRepository;
import org.example.pocztabackend.repository.PointRepository;
import org.example.pocztabackend.repository.RoleRepository;
import org.example.pocztabackend.repository.ShipmentRepository;
import org.example.pocztabackend.repository.TrackingEventRepository;
import org.example.pocztabackend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PointOperationContractServiceTest {

    @Mock
    private PointRepository pointRepository;

    @Mock
    private ShipmentRepository shipmentRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private TrackingEventRepository trackingEventRepository;

    @Mock
    private OperationalActorResolver operationalActorResolver;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    private PointOperationContractService pointOperationContractService;

    @Mock
    private NotificationService notificationService;

    @BeforeEach
    void setUp() {
        ShipmentWorkflowService workflowService = new ShipmentWorkflowService(notificationService);
        PaymentService paymentService = new PaymentService(paymentRepository, shipmentRepository, workflowService);
        pointOperationContractService = new PointOperationContractService(
                pointRepository,
                shipmentRepository,
                workflowService,
                paymentRepository,
                paymentService,
                trackingEventRepository,
                operationalActorResolver,
                userRepository,
                roleRepository,
                new ShipmentRoutingService()
        );
    }

    @Test
    void shouldCollectOfflinePaymentAndReleaseShipment() {
        String pointUserEmail = "point@example.com";
        String trackingNumber = "PWTEST123PL";
        UUID paymentId = UUID.randomUUID();

        Point point = new Point();
        point.setPointCode("POP-WAW-01");
        point.setName("Warsaw Pickup Central");

        Shipment shipment = new Shipment();
        shipment.setId(UUID.randomUUID());
        shipment.setTrackingNumber(trackingNumber);
        shipment.setStatus(ShipmentStatus.CREATED);
        shipment.setDeliveryType("PICKUP_POINT");
        shipment.setShipmentRouteStatus(ShipmentRouteStatus.READY_FOR_HANDOVER.name());
        shipment.setCurrentNodeType(ShipmentNodeType.CLIENT.name());
        shipment.setCurrentPoint(point);
        shipment.setTargetPoint(point);

        Payment payment = new Payment();
        payment.setId(paymentId);
        payment.setShipment(shipment);
        payment.setAmount(BigDecimal.valueOf(19.90));
        payment.setMethod("OFFLINE_AT_POINT");
        payment.setStatus(PaymentStatus.OFFLINE_PENDING);
        payment.setCreatedAt(LocalDateTime.now());

        when(operationalActorResolver.requirePointActorPoint(pointUserEmail)).thenReturn(point);
        when(shipmentRepository.findByTrackingNumber(trackingNumber)).thenReturn(Optional.of(shipment));
        when(paymentRepository.findAllByShipment_IdOrderByCreatedAtDesc(shipment.getId())).thenReturn(List.of(payment));
        when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(shipmentRepository.save(any(Shipment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PointCheckoutResponse response = pointOperationContractService.collectOfflinePaymentAndReleaseShipment(pointUserEmail, trackingNumber);

        assertEquals(trackingNumber, response.trackingNumber());
        assertEquals(PaymentStatus.OFFLINE_CONFIRMED.name(), response.paymentStatus());
        assertEquals(ShipmentStatus.DELIVERED.name(), response.shipmentStatus());
        assertEquals(ShipmentStatus.DELIVERED, shipment.getStatus());
        verify(trackingEventRepository, times(2)).save(any(TrackingEvent.class));
    }

    @Test
    void shouldKeepAcceptedAtSourceShipmentVisibleInPointAcceptQueue() {
        String pointUserEmail = "point@example.com";

        Point point = new Point();
        point.setPointCode("POP-WAW-01");
        point.setName("Warsaw Pickup Central");

        Shipment shipment = new Shipment();
        shipment.setId(UUID.randomUUID());
        shipment.setTrackingNumber("PWREADY123PL");
        shipment.setStatus(ShipmentStatus.READY_FOR_POSTING);
        shipment.setDeliveryType("COURIER");
        shipment.setSourcePoint(point);
        shipment.setCurrentPoint(point);
        shipment.setShipmentRouteStatus(ShipmentRouteStatus.ACCEPTED_AT_SOURCE.name());
        shipment.setCurrentNodeType(ShipmentNodeType.SOURCE_POINT.name());
        shipment.setCurrentNodeCode(point.getPointCode());
        shipment.setCreatedAt(LocalDateTime.now());
        shipment.setRecipientName("Anna Nowak");

        when(operationalActorResolver.requirePointActorPoint(pointUserEmail)).thenReturn(point);
        when(shipmentRepository.findAll()).thenReturn(List.of(shipment));
        when(paymentRepository.findAll()).thenReturn(List.of());
        when(paymentRepository.findAllByShipment_IdOrderByCreatedAtDesc(shipment.getId())).thenReturn(List.of());

        PointQueueResponse response = pointOperationContractService.getQueue(pointUserEmail);

        assertEquals(1, response.acceptQueue().size());
        assertEquals("POST_FROM_SOURCE", response.acceptQueue().get(0).queueType());
        assertEquals("ACCEPTED_AT_SOURCE", response.acceptQueue().get(0).shipmentStatus());
        assertTrue(response.pickupQueue().isEmpty());
    }
}
