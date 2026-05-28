package org.example.pocztabackend.dto;

import java.math.BigDecimal;

public record WalkInShipmentRequest(
        String senderName,
        String senderPhone,
        String senderAddress,
        String recipientName,
        String recipientPhone,
        String recipientAddress,
        BigDecimal weight,
        String sizeCategory,
        BigDecimal declaredValue,
        Boolean fragile
) {}
