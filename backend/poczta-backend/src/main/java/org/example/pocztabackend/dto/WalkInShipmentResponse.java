package org.example.pocztabackend.dto;

import java.math.BigDecimal;

public record WalkInShipmentResponse(
        String trackingNumber,
        String shipmentStatus,
        String paymentStatus,
        BigDecimal amount,
        String pointCode,
        String pointName
) {}
