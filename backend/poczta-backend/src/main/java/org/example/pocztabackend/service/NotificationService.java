package org.example.pocztabackend.service;

import org.example.pocztabackend.config.RabbitMQConfig;
import org.example.pocztabackend.messaging.ShipmentStatusChangedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final RabbitTemplate rabbitTemplate;
    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String mailFrom;

    @Value("${app.mail.enabled:true}")
    private boolean mailEnabled;

    public NotificationService(RabbitTemplate rabbitTemplate, JavaMailSender mailSender) {
        this.rabbitTemplate = rabbitTemplate;
        this.mailSender = mailSender;
    }

    public void publishShipmentStatusChanged(
            String trackingNumber,
            String recipientEmail,
            String recipientName,
            String previousStatus,
            String newStatus
    ) {
        ShipmentStatusChangedEvent event = new ShipmentStatusChangedEvent(
                trackingNumber, recipientEmail, recipientName, previousStatus, newStatus
        );
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.SHIPMENT_EXCHANGE,
                RabbitMQConfig.ROUTING_KEY,
                event
        );
        log.info("Published shipment status event: {} {} -> {}", trackingNumber, previousStatus, newStatus);
    }

    @RabbitListener(queues = RabbitMQConfig.NOTIFICATION_QUEUE)
    public void handleShipmentStatusChanged(ShipmentStatusChangedEvent event) {
        log.info("Received notification event for shipment {}: {} -> {}",
                event.trackingNumber(), event.previousStatus(), event.newStatus());

        if (mailEnabled && event.recipientEmail() != null && !event.recipientEmail().isBlank()) {
            sendStatusEmail(event);
        }
    }

    private void sendStatusEmail(ShipmentStatusChangedEvent event) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailFrom);
            message.setTo(event.recipientEmail());
            message.setSubject("PingwinPost — Aktualizacja przesyłki " + event.trackingNumber());
            message.setText(buildEmailBody(event));
            mailSender.send(message);
            log.info("Email notification sent to {} for shipment {}", event.recipientEmail(), event.trackingNumber());
        } catch (Exception e) {
            log.error("Failed to send email notification for shipment {}: {}", event.trackingNumber(), e.getMessage());
        }
    }

    private String buildEmailBody(ShipmentStatusChangedEvent event) {
        return String.format("""
                Szanowny/a %s,

                Status Twojej przesyłki %s został zaktualizowany.

                Poprzedni status: %s
                Nowy status:      %s

                Śledź swoją przesyłkę na stronie PingwinPost.

                Pozdrawiamy,
                Zespół PingwinPost
                """,
                event.recipientName() != null ? event.recipientName() : "Kliencie",
                event.trackingNumber(),
                event.previousStatus(),
                event.newStatus()
        );
    }
}
