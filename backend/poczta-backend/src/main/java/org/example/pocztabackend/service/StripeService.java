package org.example.pocztabackend.service;

import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import jakarta.annotation.PostConstruct;
import org.example.pocztabackend.model.Payment;
import org.example.pocztabackend.model.Shipment;
import org.example.pocztabackend.model.enums.PaymentStatus;
import org.example.pocztabackend.model.enums.ShipmentStatus;
import org.example.pocztabackend.repository.PaymentRepository;
import org.example.pocztabackend.repository.ShipmentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
public class StripeService {

    private static final Logger log = LoggerFactory.getLogger(StripeService.class);

    @Value("${stripe.secret-key}")
    private String secretKey;

    @Value("${stripe.webhook-secret}")
    private String webhookSecret;

    @Value("${stripe.success-url}")
    private String successUrl;

    @Value("${stripe.cancel-url}")
    private String cancelUrl;

    private final PaymentRepository paymentRepository;
    private final ShipmentRepository shipmentRepository;
    private final ShipmentWorkflowService shipmentWorkflowService;

    public StripeService(
            PaymentRepository paymentRepository,
            ShipmentRepository shipmentRepository,
            ShipmentWorkflowService shipmentWorkflowService
    ) {
        this.paymentRepository = paymentRepository;
        this.shipmentRepository = shipmentRepository;
        this.shipmentWorkflowService = shipmentWorkflowService;
    }

    @PostConstruct
    public void init() {
        Stripe.apiKey = secretKey;
    }

    public String createCheckoutSession(UUID paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));

        if (payment.getStatus() != PaymentStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Payment is not in PENDING status");
        }

        try {
            String resolvedSuccessUrl = successUrl.replace("{paymentId}", paymentId.toString()) + "?session_id={CHECKOUT_SESSION_ID}";
            String resolvedCancelUrl = cancelUrl.replace("{paymentId}", paymentId.toString());

            SessionCreateParams params = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                    .setSuccessUrl(resolvedSuccessUrl)
                    .setCancelUrl(resolvedCancelUrl)
                    .addLineItem(
                            SessionCreateParams.LineItem.builder()
                                    .setQuantity(1L)
                                    .setPriceData(
                                            SessionCreateParams.LineItem.PriceData.builder()
                                                    .setCurrency("pln")
                                                    .setUnitAmount(payment.getAmount().multiply(java.math.BigDecimal.valueOf(100)).longValue())
                                                    .setProductData(
                                                            SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                    .setName("Przesyłka PingwinPost")
                                                                    .setDescription("Nr śledzenia: " + payment.getShipment().getTrackingNumber())
                                                                    .build()
                                                    )
                                                    .build()
                                    )
                                    .build()
                    )
                    .putMetadata("paymentId", paymentId.toString())
                    .build();

            Session session = Session.create(params);
            log.info("Created Stripe session {} for payment {}", session.getId(), paymentId);
            return session.getUrl();

        } catch (StripeException e) {
            log.error("Stripe error creating session for payment {}: {}", paymentId, e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Stripe error: " + e.getMessage());
        }
    }

    /**
     * Verifies a Stripe Checkout Session by ID (called from success page).
     * Does NOT require webhook secret — uses the secret key to fetch session from Stripe API.
     */
    @Transactional
    public String verifySession(UUID paymentId, String sessionId) {
        try {
            Session session = Session.retrieve(sessionId);
            String paymentStatus = session.getPaymentStatus(); // "paid", "unpaid", "no_payment_required"

            Payment payment = paymentRepository.findById(paymentId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));

            if ("paid".equals(paymentStatus)) {
                markPaymentAndShipmentPaid(payment, session.getId());
                log.info("Payment {} marked as PAID via session verify", paymentId);
                return "PAID";
            } else {
                log.info("Session {} not paid yet, status: {}", sessionId, paymentStatus);
                return "PENDING";
            }
        } catch (StripeException e) {
            log.error("Stripe error verifying session {}: {}", sessionId, e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Stripe error: " + e.getMessage());
        }
    }

    @Transactional
    public void handleWebhook(String payload, String sigHeader) {
        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        } catch (SignatureVerificationException e) {
            log.warn("Invalid Stripe webhook signature");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid signature");
        }

        log.info("Received Stripe webhook event: {}", event.getType());

        if ("checkout.session.completed".equals(event.getType())) {
            Session session = (Session) event.getDataObjectDeserializer()
                    .getObject()
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot deserialize session"));

            String paymentIdStr = session.getMetadata().get("paymentId");
            if (paymentIdStr == null) return;

            UUID paymentId = UUID.fromString(paymentIdStr);
            paymentRepository.findById(paymentId).ifPresent(payment -> {
                markPaymentAndShipmentPaid(payment, session.getId());
                log.info("Payment {} marked as PAID via Stripe webhook", paymentId);
            });
        }

        if ("checkout.session.expired".equals(event.getType())) {
            Session session = (Session) event.getDataObjectDeserializer()
                    .getObject()
                    .orElse(null);
            if (session == null) return;

            String paymentIdStr = session.getMetadata().get("paymentId");
            if (paymentIdStr == null) return;

            UUID paymentId = UUID.fromString(paymentIdStr);
            paymentRepository.findById(paymentId).ifPresent(payment -> {
                payment.setStatus(PaymentStatus.FAILED);
                paymentRepository.save(payment);
                log.info("Payment {} marked as FAILED via Stripe webhook", paymentId);
            });
        }
    }

    void markPaymentAndShipmentPaid(Payment payment, String externalReference) {
        payment.setStatus(PaymentStatus.PAID);
        payment.setExternalReference(externalReference);

        Shipment shipment = payment.getShipment();
        if (shipment != null && shipment.getStatus() == ShipmentStatus.CREATED) {
            shipmentWorkflowService.changeStatus(shipment, ShipmentStatus.PAID);
            shipmentRepository.save(shipment);
        }

        paymentRepository.save(payment);
    }
}
