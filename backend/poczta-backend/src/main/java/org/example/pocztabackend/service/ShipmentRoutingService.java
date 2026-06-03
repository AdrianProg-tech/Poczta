package org.example.pocztabackend.service;

import org.example.pocztabackend.model.CourierTask;
import org.example.pocztabackend.model.Payment;
import org.example.pocztabackend.model.Point;
import org.example.pocztabackend.model.Shipment;
import org.example.pocztabackend.model.enums.PaymentStatus;
import org.example.pocztabackend.model.enums.ShipmentNodeType;
import org.example.pocztabackend.model.enums.ShipmentRouteStatus;
import org.example.pocztabackend.model.enums.ShipmentStatus;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class ShipmentRoutingService {

    public ShipmentRoutingSnapshot snapshot(Shipment shipment, Payment latestPayment, CourierTask latestTask) {
        String intakeMethod = resolveIntakeMethod(shipment);
        String deliveryMethod = resolveDeliveryMethod(shipment);
        ShipmentRouteStatus routeStatus = resolveRouteStatus(shipment, latestPayment, latestTask);
        ShipmentNodeType currentNodeType = resolveCurrentNodeType(shipment, routeStatus, latestTask);
        String currentNodeCode = resolveCurrentNodeCode(shipment, currentNodeType, latestTask);
        String nextOwner = resolveNextOwner(routeStatus, intakeMethod, deliveryMethod, latestPayment, latestTask);
        List<String> availableActions = resolveAvailableActions(routeStatus, intakeMethod, deliveryMethod, latestTask);

        return new ShipmentRoutingSnapshot(
                intakeMethod,
                deliveryMethod,
                routeStatus.name(),
                currentNodeType.name(),
                currentNodeCode,
                nextOwner,
                availableActions
        );
    }

    public String resolveIntakeMethod(Shipment shipment) {
        String stored = normalize(shipment.getIntakeMethod());
        if (stored != null) {
            return stored;
        }
        if (shipment.getSourcePoint() != null) {
            return "POINT_DROPOFF";
        }
        return "COURIER_PICKUP";
    }

    public String resolveDeliveryMethod(Shipment shipment) {
        String stored = normalize(shipment.getDeliveryMethod());
        if (stored != null) {
            return stored;
        }
        String deliveryType = normalize(shipment.getDeliveryType());
        if ("PICKUP_POINT".equals(deliveryType)) {
            return "PICKUP_POINT";
        }
        if ("PARCEL_LOCKER".equals(deliveryType)) {
            return "LOCKER_DEMO";
        }
        return "COURIER_HOME";
    }

    public ShipmentRouteStatus resolveRouteStatus(Shipment shipment, Payment latestPayment, CourierTask latestTask) {
        String explicit = normalize(shipment.getShipmentRouteStatus());
        if (explicit != null) {
            try {
                return ShipmentRouteStatus.valueOf(explicit);
            } catch (IllegalArgumentException ignored) {
                // fall back to legacy inference for old data
            }
        }

        ShipmentStatus legacyStatus = shipment.getStatus();
        if (legacyStatus == null) {
            return ShipmentRouteStatus.READY_FOR_HANDOVER;
        }

        return switch (legacyStatus) {
            case CANCELED -> ShipmentRouteStatus.CANCELED;
            case RETURNED -> ShipmentRouteStatus.RETURNED;
            case DELIVERED -> ShipmentRouteStatus.DELIVERED;
            case AWAITING_PICKUP -> isLockerDelivery(shipment)
                    ? ShipmentRouteStatus.AWAITING_LOCKER_PICKUP
                    : ShipmentRouteStatus.AWAITING_PICKUP;
            case REDIRECTED_TO_PICKUP -> ShipmentRouteStatus.RETURN_IN_TRANSIT;
            case DELIVERY_ATTEMPT -> ShipmentRouteStatus.DELIVERY_ATTEMPT_FAILED;
            case OUT_FOR_DELIVERY -> ShipmentRouteStatus.OUT_FOR_DELIVERY;
            case IN_TRANSIT -> latestTask != null && isTaskInFlight(latestTask)
                    ? ShipmentRouteStatus.OUT_FOR_DELIVERY
                    : ShipmentRouteStatus.AT_DESTINATION_HUB;
            case POSTED -> ShipmentRouteStatus.IN_TRANSIT_TO_DESTINATION_HUB;
            case READY_FOR_POSTING -> ShipmentRouteStatus.ACCEPTED_AT_SOURCE;
            case REGISTERED, CREATED, PAID -> {
                if (latestPayment != null && latestPayment.getStatus() == PaymentStatus.OFFLINE_CONFIRMED && shipment.getSourcePoint() != null) {
                    yield ShipmentRouteStatus.ACCEPTED_AT_SOURCE;
                }
                yield ShipmentRouteStatus.READY_FOR_HANDOVER;
            }
        };
    }

    private ShipmentNodeType resolveCurrentNodeType(Shipment shipment, ShipmentRouteStatus routeStatus, CourierTask latestTask) {
        String explicit = normalize(shipment.getCurrentNodeType());
        if (explicit != null) {
            try {
                return ShipmentNodeType.valueOf(explicit);
            } catch (IllegalArgumentException ignored) {
                // continue with inferred value
            }
        }

        return switch (routeStatus) {
            case READY_FOR_HANDOVER -> isActivePickupTask(latestTask) ? ShipmentNodeType.COURIER : ShipmentNodeType.CLIENT;
            case ACCEPTED_AT_SOURCE -> ShipmentNodeType.SOURCE_POINT;
            case IN_TRANSIT_TO_ORIGIN_HUB, AT_ORIGIN_HUB, IN_TRANSIT_TO_DESTINATION_HUB, AT_DESTINATION_HUB -> ShipmentNodeType.DESTINATION_HUB;
            case OUT_FOR_DELIVERY -> ShipmentNodeType.COURIER;
            case IN_TRANSIT_TO_TARGET_POINT -> ShipmentNodeType.DESTINATION_HUB;
            case AWAITING_PICKUP -> ShipmentNodeType.TARGET_POINT;
            case IN_TRANSIT_TO_TARGET_LOCKER -> ShipmentNodeType.DESTINATION_HUB;
            case AWAITING_LOCKER_PICKUP -> ShipmentNodeType.LOCKER;
            case DELIVERY_ATTEMPT_FAILED, RETURN_IN_TRANSIT, RETURNED -> ShipmentNodeType.RETURN_FLOW;
            case DELIVERED, CANCELED -> ShipmentNodeType.UNKNOWN;
        };
    }

    private String resolveCurrentNodeCode(Shipment shipment, ShipmentNodeType nodeType, CourierTask latestTask) {
        String explicit = shipment.getCurrentNodeCode();
        if (explicit != null && !explicit.isBlank()) {
            return explicit;
        }

        return switch (nodeType) {
            case CLIENT -> shipment.getCreator() != null ? shipment.getCreator().getEmail() : "CLIENT";
            case SOURCE_POINT -> pointCode(shipment.getSourcePoint() != null ? shipment.getSourcePoint() : shipment.getCurrentPoint());
            case TARGET_POINT -> pointCode(shipment.getTargetPoint() != null ? shipment.getTargetPoint() : shipment.getCurrentPoint());
            case LOCKER -> pointCode(shipment.getTargetPoint());
            case COURIER -> latestTask != null && latestTask.getCourier() != null ? latestTask.getCourier().getEmail() : "COURIER";
            case DESTINATION_HUB, ORIGIN_HUB -> "HUB-" + destinationCity(shipment);
            case RETURN_FLOW -> "RETURN-" + destinationCity(shipment);
            case UNKNOWN -> null;
        };
    }

    private String resolveNextOwner(
            ShipmentRouteStatus routeStatus,
            String intakeMethod,
            String deliveryMethod,
            Payment latestPayment,
            CourierTask latestTask
    ) {
        return switch (routeStatus) {
            case READY_FOR_HANDOVER -> {
                if (latestPayment != null && latestPayment.getStatus() == PaymentStatus.PENDING) {
                    yield "CLIENT";
                }
                if ("COURIER_PICKUP".equals(intakeMethod)) {
                    yield isActivePickupTask(latestTask) ? "COURIER" : "COURIER";
                }
                yield "POINT";
            }
            case ACCEPTED_AT_SOURCE -> "POINT";
            case IN_TRANSIT_TO_ORIGIN_HUB, AT_ORIGIN_HUB, IN_TRANSIT_TO_DESTINATION_HUB, AT_DESTINATION_HUB, RETURN_IN_TRANSIT -> "HUB";
            case OUT_FOR_DELIVERY, DELIVERY_ATTEMPT_FAILED -> "COURIER";
            case IN_TRANSIT_TO_TARGET_POINT, AWAITING_PICKUP -> "POINT";
            case IN_TRANSIT_TO_TARGET_LOCKER, AWAITING_LOCKER_PICKUP -> "LOCKER";
            case DELIVERED, RETURNED, CANCELED -> "SYSTEM";
        };
    }

    private List<String> resolveAvailableActions(
            ShipmentRouteStatus routeStatus,
            String intakeMethod,
            String deliveryMethod,
            CourierTask latestTask
    ) {
        List<String> actions = new ArrayList<>();
        switch (routeStatus) {
            case READY_FOR_HANDOVER -> {
                if ("POINT_DROPOFF".equals(intakeMethod)) {
                    actions.add("ACCEPT_AT_SOURCE");
                }
            }
            case ACCEPTED_AT_SOURCE -> actions.add("POST_FROM_SOURCE");
            case IN_TRANSIT_TO_ORIGIN_HUB, IN_TRANSIT_TO_DESTINATION_HUB -> actions.add("ACCEPT_AT_DESTINATION_HUB");
            case AT_DESTINATION_HUB -> {
                if ("COURIER_HOME".equals(deliveryMethod)) {
                    actions.add("ASSIGN_COURIER");
                }
                if ("PICKUP_POINT".equals(deliveryMethod)) {
                    actions.add("ROUTE_TO_TARGET_POINT");
                }
                if ("LOCKER_DEMO".equals(deliveryMethod)) {
                    actions.add("ROUTE_TO_LOCKER");
                }
            }
            case OUT_FOR_DELIVERY -> {
                actions.add("COMPLETE_DELIVERY");
                actions.add("RECORD_ATTEMPT");
            }
            case DELIVERY_ATTEMPT_FAILED -> actions.add("RETURN_TO_DESTINATION_HUB");
            case IN_TRANSIT_TO_TARGET_POINT -> actions.add("ACCEPT_AT_TARGET_POINT");
            case AWAITING_PICKUP, AWAITING_LOCKER_PICKUP -> actions.add("RELEASE_TO_RECIPIENT");
            default -> {
            }
        }
        return actions;
    }

    public void applyRouteState(Shipment shipment, ShipmentRouteStatus routeStatus, ShipmentNodeType nodeType, String nodeCode) {
        shipment.setShipmentRouteStatus(routeStatus.name());
        shipment.setCurrentNodeType(nodeType.name());
        shipment.setCurrentNodeCode(nodeCode);
    }

    private boolean isTaskInFlight(CourierTask latestTask) {
        String status = normalize(latestTask.getStatus());
        return "IN_PROGRESS".equals(status);
    }

    private boolean isActivePickupTask(CourierTask latestTask) {
        if (latestTask == null) {
            return false;
        }
        String type = normalize(latestTask.getTaskType());
        String status = normalize(latestTask.getStatus());
        return "PICKUP".equals(type) && ("ASSIGNED".equals(status) || "ACCEPTED".equals(status) || "IN_PROGRESS".equals(status));
    }

    private boolean isLockerDelivery(Shipment shipment) {
        return "LOCKER_DEMO".equals(resolveDeliveryMethod(shipment));
    }

    private String pointCode(Point point) {
        return point == null ? null : point.getPointCode();
    }

    private String destinationCity(Shipment shipment) {
        Point point = shipment.getTargetPoint() != null ? shipment.getTargetPoint() : shipment.getCurrentPoint();
        if (point != null && point.getCity() != null && !point.getCity().isBlank()) {
            return point.getCity().trim().toUpperCase(Locale.ROOT);
        }
        String address = shipment.getRecipientAddress();
        if (address == null || address.isBlank()) {
            return "UNKNOWN";
        }
        int commaIndex = address.indexOf(',');
        String city = commaIndex >= 0 ? address.substring(0, commaIndex) : address;
        return city.trim().toUpperCase(Locale.ROOT);
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim().toUpperCase(Locale.ROOT);
    }
}
