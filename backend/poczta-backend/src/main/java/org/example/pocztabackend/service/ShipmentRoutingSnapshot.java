package org.example.pocztabackend.service;

import java.util.List;

public record ShipmentRoutingSnapshot(
        String intakeMethod,
        String deliveryMethod,
        String shipmentRouteStatus,
        String currentNodeType,
        String currentNodeCode,
        String nextOwner,
        List<String> availableActions
) {
}
