package org.example.pocztabackend.service;

import org.example.pocztabackend.model.Shipment;
import org.example.pocztabackend.model.enums.ShipmentStatus;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

@Service
public class ShipmentWorkflowService {

    private final Map<ShipmentStatus, Set<ShipmentStatus>> allowedTransitions = new EnumMap<>(ShipmentStatus.class);

    public ShipmentWorkflowService() {
        allowedTransitions.put(ShipmentStatus.REGISTERED, EnumSet.of(ShipmentStatus.CREATED, ShipmentStatus.CANCELED));
        allowedTransitions.put(ShipmentStatus.CREATED, EnumSet.of(ShipmentStatus.PAID, ShipmentStatus.READY_FOR_POSTING, ShipmentStatus.CANCELED));
        allowedTransitions.put(ShipmentStatus.PAID, EnumSet.of(ShipmentStatus.READY_FOR_POSTING, ShipmentStatus.CANCELED));
        allowedTransitions.put(ShipmentStatus.READY_FOR_POSTING, EnumSet.of(ShipmentStatus.POSTED, ShipmentStatus.CANCELED));
        allowedTransitions.put(ShipmentStatus.POSTED, EnumSet.of(ShipmentStatus.IN_TRANSIT, ShipmentStatus.RETURNED));
        allowedTransitions.put(ShipmentStatus.IN_TRANSIT, EnumSet.of(ShipmentStatus.OUT_FOR_DELIVERY, ShipmentStatus.REDIRECTED_TO_PICKUP, ShipmentStatus.AWAITING_PICKUP, ShipmentStatus.RETURNED));
        allowedTransitions.put(ShipmentStatus.OUT_FOR_DELIVERY, EnumSet.of(ShipmentStatus.DELIVERY_ATTEMPT, ShipmentStatus.DELIVERED, ShipmentStatus.RETURNED));
        allowedTransitions.put(ShipmentStatus.DELIVERY_ATTEMPT, EnumSet.of(ShipmentStatus.OUT_FOR_DELIVERY, ShipmentStatus.REDIRECTED_TO_PICKUP, ShipmentStatus.AWAITING_PICKUP, ShipmentStatus.RETURNED));
        allowedTransitions.put(ShipmentStatus.REDIRECTED_TO_PICKUP, EnumSet.of(ShipmentStatus.AWAITING_PICKUP, ShipmentStatus.RETURNED));
        allowedTransitions.put(ShipmentStatus.AWAITING_PICKUP, EnumSet.of(ShipmentStatus.DELIVERED, ShipmentStatus.RETURNED));
        allowedTransitions.put(ShipmentStatus.DELIVERED, EnumSet.noneOf(ShipmentStatus.class));
        allowedTransitions.put(ShipmentStatus.RETURNED, EnumSet.noneOf(ShipmentStatus.class));
        allowedTransitions.put(ShipmentStatus.CANCELED, EnumSet.noneOf(ShipmentStatus.class));
    }

    public ShipmentStatus changeStatus(Shipment shipment, ShipmentStatus targetStatus) {
        if (targetStatus == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status is required");
        }

        ShipmentStatus currentStatus = shipment.getStatus();
        if (currentStatus == null) {
            shipment.setStatus(targetStatus);
            return targetStatus;
        }
        if (currentStatus == targetStatus) {
            return targetStatus;
        }

        Set<ShipmentStatus> allowedTargets = allowedTransitions.getOrDefault(currentStatus, EnumSet.noneOf(ShipmentStatus.class));
        if (!allowedTargets.contains(targetStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid shipment status transition: " + currentStatus + " -> " + targetStatus
            );
        }

        shipment.setStatus(targetStatus);
        return targetStatus;
    }
}
