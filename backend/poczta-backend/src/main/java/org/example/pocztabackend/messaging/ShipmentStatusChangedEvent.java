package org.example.pocztabackend.messaging;

import java.io.Serializable;

public record ShipmentStatusChangedEvent(
        String trackingNumber,
        String recipientEmail,
        String recipientName,
        String previousStatus,
        String newStatus
) implements Serializable {}
