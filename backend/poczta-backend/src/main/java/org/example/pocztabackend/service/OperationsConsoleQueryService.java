package org.example.pocztabackend.service;

import org.example.pocztabackend.dto.OpsCourierDispatchResponse;
import org.example.pocztabackend.dto.OpsCourierSummaryResponse;
import org.example.pocztabackend.dto.OpsDashboardSummaryResponse;
import org.example.pocztabackend.dto.OpsDispatchCandidateResponse;
import org.example.pocztabackend.dto.OpsReassignmentCandidateResponse;
import org.example.pocztabackend.dto.OpsRecentEventResponse;
import org.example.pocztabackend.dto.OpsShipmentBoardItemResponse;
import org.example.pocztabackend.model.Complaint;
import org.example.pocztabackend.model.CourierTask;
import org.example.pocztabackend.model.Payment;
import org.example.pocztabackend.model.Point;
import org.example.pocztabackend.model.Shipment;
import org.example.pocztabackend.model.TrackingEvent;
import org.example.pocztabackend.model.User;
import org.example.pocztabackend.model.enums.ComplaintStatus;
import org.example.pocztabackend.model.enums.PaymentStatus;
import org.example.pocztabackend.model.enums.ShipmentStatus;
import org.example.pocztabackend.repository.ComplaintRepository;
import org.example.pocztabackend.repository.CourierTaskRepository;
import org.example.pocztabackend.repository.PaymentRepository;
import org.example.pocztabackend.repository.ShipmentRepository;
import org.example.pocztabackend.repository.TrackingEventRepository;
import org.example.pocztabackend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.AbstractMap;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class OperationsConsoleQueryService {

    private final ShipmentRepository shipmentRepository;
    private final PaymentRepository paymentRepository;
    private final CourierTaskRepository courierTaskRepository;
    private final ComplaintRepository complaintRepository;
    private final TrackingEventRepository trackingEventRepository;
    private final UserRepository userRepository;

    public OperationsConsoleQueryService(
            ShipmentRepository shipmentRepository,
            PaymentRepository paymentRepository,
            CourierTaskRepository courierTaskRepository,
            ComplaintRepository complaintRepository,
            TrackingEventRepository trackingEventRepository,
            UserRepository userRepository
    ) {
        this.shipmentRepository = shipmentRepository;
        this.paymentRepository = paymentRepository;
        this.courierTaskRepository = courierTaskRepository;
        this.complaintRepository = complaintRepository;
        this.trackingEventRepository = trackingEventRepository;
        this.userRepository = userRepository;
    }

    public OpsDashboardSummaryResponse getDashboardSummary() {
        List<Shipment> shipments = shipmentRepository.findAll();
        Map<UUID, Payment> latestPaymentByShipmentId = getLatestPaymentByShipmentId(paymentRepository.findAll());
        List<CourierTask> courierTasks = courierTaskRepository.findAll();
        List<Complaint> complaints = complaintRepository.findAll();

        long pendingPaymentShipments = shipments.stream()
                .filter(shipment -> getLatestPaymentStatus(shipment, latestPaymentByShipmentId) == PaymentStatus.PENDING)
                .count();

        long paymentFailedShipments = shipments.stream()
                .filter(shipment -> getLatestPaymentStatus(shipment, latestPaymentByShipmentId) == PaymentStatus.FAILED)
                .count();

        long readyForDispatchShipments = shipments.stream()
                .filter(shipment -> shipment.getStatus() == ShipmentStatus.READY_FOR_POSTING)
                .count();

        long awaitingCourierAssignmentShipments = shipments.stream()
                .filter(shipment -> isCourierFlow(shipment))
                .filter(shipment -> shipment.getStatus() == ShipmentStatus.READY_FOR_POSTING)
                .filter(shipment -> findLatestTaskForShipment(shipment, courierTasks) == null)
                .count();

        long redirectedToPickupShipments = shipments.stream()
                .filter(shipment -> shipment.getStatus() == ShipmentStatus.REDIRECTED_TO_PICKUP)
                .count();

        long awaitingPickupShipments = shipments.stream()
                .filter(shipment -> shipment.getStatus() == ShipmentStatus.AWAITING_PICKUP)
                .count();

        long activeCourierTasks = courierTasks.stream()
                .filter(task -> isTaskOpen(task.getStatus()))
                .count();

        long complaintsInReview = complaints.stream()
                .filter(complaint -> complaint.getStatus() == ComplaintStatus.IN_REVIEW)
                .count();

        return new OpsDashboardSummaryResponse(
                shipments.size(),
                pendingPaymentShipments,
                paymentFailedShipments,
                readyForDispatchShipments,
                awaitingCourierAssignmentShipments,
                redirectedToPickupShipments,
                awaitingPickupShipments,
                activeCourierTasks,
                complaintsInReview
        );
    }

    public List<OpsShipmentBoardItemResponse> getShipmentBoard() {
        List<Shipment> shipments = shipmentRepository.findAll();
        List<Payment> payments = paymentRepository.findAll();
        List<CourierTask> tasks = courierTaskRepository.findAll();

        Map<UUID, Payment> latestPaymentByShipmentId = getLatestPaymentByShipmentId(payments);

        return shipments.stream()
                .sorted(Comparator.comparing(Shipment::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(shipment -> toShipmentBoardItem(shipment, latestPaymentByShipmentId, tasks))
                .toList();
    }

    public OpsCourierDispatchResponse getCourierDispatch() {
        List<CourierTask> tasks = courierTaskRepository.findAll();
        List<Shipment> shipments = shipmentRepository.findAll();
        List<User> courierUsers = getCourierUsers(tasks);

        List<OpsCourierSummaryResponse> courierSummaries = courierUsers.stream()
                .map(courier -> toCourierSummary(courier, tasks))
                .sorted(Comparator.comparing(OpsCourierSummaryResponse::courierEmail, Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();

        List<OpsDispatchCandidateResponse> pendingAssignments = shipments.stream()
                .filter(this::isCourierFlow)
                .filter(shipment -> shipment.getStatus() == ShipmentStatus.READY_FOR_POSTING)
                .filter(shipment -> findLatestTaskForShipment(shipment, tasks) == null)
                .map(shipment -> toDispatchCandidate(shipment, courierSummaries, null))
                .toList();

        List<OpsReassignmentCandidateResponse> reassignmentCandidates = shipments.stream()
                .filter(this::isCourierFlow)
                .filter(shipment -> shipment.getStatus() == ShipmentStatus.READY_FOR_POSTING)
                .map(shipment -> new AbstractMap.SimpleEntry<>(shipment, findLatestTaskForShipment(shipment, tasks)))
                .filter(entry -> entry.getValue() != null)
                .filter(entry -> isReassignmentEligible(entry.getValue()))
                .map(entry -> toReassignmentCandidate(entry.getKey(), entry.getValue(), courierSummaries))
                .toList();

        return new OpsCourierDispatchResponse(courierSummaries, pendingAssignments, reassignmentCandidates);
    }

    public List<OpsRecentEventResponse> getRecentEvents() {
        return trackingEventRepository.findAll().stream()
                .sorted(Comparator.comparing(TrackingEvent::getEventTime, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(25)
                .map(event -> new OpsRecentEventResponse(
                        event.getShipment() == null ? null : event.getShipment().getTrackingNumber(),
                        event.getStatus(),
                        event.getLocationName(),
                        event.getDescription(),
                        event.getEventTime()
                ))
                .toList();
    }

    private OpsShipmentBoardItemResponse toShipmentBoardItem(
            Shipment shipment,
            Map<UUID, Payment> latestPaymentByShipmentId,
            List<CourierTask> tasks
    ) {
        Payment latestPayment = latestPaymentByShipmentId.get(shipment.getId());
        CourierTask latestTask = findLatestTaskForShipment(shipment, tasks);
        ShipmentBoardAdvice advice = getShipmentBoardAdvice(shipment, latestPayment, latestTask);

        return new OpsShipmentBoardItemResponse(
                shipment.getId(),
                shipment.getTrackingNumber(),
                shipment.getStatus() == null ? null : shipment.getStatus().name(),
                latestPayment == null || latestPayment.getStatus() == null ? null : latestPayment.getStatus().name(),
                shipment.getDeliveryType(),
                extractCity(shipment.getSenderAddress()),
                getDestinationCity(shipment),
                getPointCode(shipment.getTargetPoint()),
                latestTask == null || latestTask.getCourier() == null ? null : latestTask.getCourier().getEmail(),
                advice.nextActionOwner(),
                advice.nextSuggestedAction(),
                advice.blockedReason(),
                shipment.getCreatedAt()
        );
    }

    private OpsCourierSummaryResponse toCourierSummary(User courier, List<CourierTask> tasks) {
        List<CourierTask> courierTasks = tasks.stream()
                .filter(task -> task.getCourier() != null && courier.getId().equals(task.getCourier().getId()))
                .toList();

        long openTaskCount = courierTasks.stream()
                .filter(task -> isTaskOpen(task.getStatus()))
                .count();

        long inProgressTaskCount = courierTasks.stream()
                .filter(task -> normalize(task.getStatus()).equals("IN_PROGRESS"))
                .count();

        long failedTaskCount = courierTasks.stream()
                .filter(task -> normalize(task.getStatus()).equals("FAILED"))
                .count();

        String displayName = buildDisplayName(courier);
        String inferredServiceCity = inferCourierServiceCity(courier, courierTasks);

        return new OpsCourierSummaryResponse(
                courier.getId(),
                courier.getEmail(),
                displayName,
                inferredServiceCity,
                openTaskCount,
                inProgressTaskCount,
                failedTaskCount,
                courier.isActive() && openTaskCount < 5
        );
    }

    private OpsDispatchCandidateResponse toDispatchCandidate(
            Shipment shipment,
            List<OpsCourierSummaryResponse> courierSummaries,
            UUID excludedCourierId
    ) {
        String destinationCity = getDestinationCity(shipment);
        OpsCourierSummaryResponse suggestedCourier = suggestCourier(courierSummaries, destinationCity, excludedCourierId);

        String suggestionReason = suggestedCourier == null
                ? "No courier profiles available"
                : matchesCity(suggestedCourier.inferredServiceCity(), destinationCity)
                ? "Best match by inferred city and lowest open task count"
                : "Fallback suggestion by lowest open task count";

        return new OpsDispatchCandidateResponse(
                shipment.getId(),
                shipment.getTrackingNumber(),
                destinationCity,
                shipment.getStatus() == null ? null : shipment.getStatus().name(),
                suggestedCourier == null ? null : suggestedCourier.courierId(),
                suggestedCourier == null ? null : suggestedCourier.courierEmail(),
                suggestionReason
        );
    }

    private OpsReassignmentCandidateResponse toReassignmentCandidate(
            Shipment shipment,
            CourierTask latestTask,
            List<OpsCourierSummaryResponse> courierSummaries
    ) {
        UUID currentCourierId = latestTask.getCourier() == null ? null : latestTask.getCourier().getId();
        OpsDispatchCandidateResponse suggestion = toDispatchCandidate(shipment, courierSummaries, currentCourierId);

        return new OpsReassignmentCandidateResponse(
                shipment.getId(),
                latestTask.getId(),
                shipment.getTrackingNumber(),
                suggestion.destinationCity(),
                suggestion.shipmentStatus(),
                latestTask.getCourier() == null ? null : latestTask.getCourier().getEmail(),
                latestTask.getStatus(),
                suggestion.suggestedCourierId(),
                suggestion.suggestedCourierEmail(),
                suggestion.suggestionReason()
        );
    }

    private OpsCourierSummaryResponse suggestCourier(
            List<OpsCourierSummaryResponse> courierSummaries,
            String destinationCity,
            UUID excludedCourierId
    ) {
        return courierSummaries.stream()
                .filter(courier -> excludedCourierId == null || !excludedCourierId.equals(courier.courierId()))
                .sorted(Comparator
                        .comparing((OpsCourierSummaryResponse courier) -> !matchesCity(courier.inferredServiceCity(), destinationCity))
                        .thenComparingLong(OpsCourierSummaryResponse::openTaskCount)
                        .thenComparing(OpsCourierSummaryResponse::courierEmail, Comparator.nullsLast(String::compareToIgnoreCase)))
                .findFirst()
                .orElse(null);
    }

    private boolean isReassignmentEligible(CourierTask task) {
        String normalizedStatus = normalize(task.getStatus());
        return normalizedStatus.equals("ASSIGNED") || normalizedStatus.equals("ACCEPTED");
    }

    private ShipmentBoardAdvice getShipmentBoardAdvice(Shipment shipment, Payment latestPayment, CourierTask latestTask) {
        ShipmentStatus status = shipment.getStatus();
        PaymentStatus paymentStatus = latestPayment == null ? null : latestPayment.getStatus();

        if (paymentStatus == PaymentStatus.PENDING) {
            return new ShipmentBoardAdvice("ADMIN", "MARK_PAYMENT_PAID", "Awaiting online payment confirmation");
        }
        if (paymentStatus == PaymentStatus.FAILED) {
            return new ShipmentBoardAdvice("CLIENT", "RESTART_PAYMENT", "Latest payment failed");
        }
        if (paymentStatus == PaymentStatus.OFFLINE_PENDING) {
            return new ShipmentBoardAdvice("POINT", "CONFIRM_OFFLINE_PAYMENT", "Waiting for offline payment confirmation at point");
        }
        if (status == ShipmentStatus.PAID) {
            return new ShipmentBoardAdvice("ADMIN", "PREPARE_FOR_DISPATCH", "Shipment paid but not yet prepared for dispatch");
        }
        if (status == ShipmentStatus.READY_FOR_POSTING && isCourierFlow(shipment) && latestTask == null) {
            return new ShipmentBoardAdvice("DISPATCH", "ASSIGN_COURIER", "Courier not assigned yet");
        }
        if (status == ShipmentStatus.READY_FOR_POSTING && isCourierFlow(shipment) && latestTask != null) {
            return new ShipmentBoardAdvice("OPS", "HAND_OVER_TO_COURIER", "Shipment ready and courier assigned");
        }
        if (normalize(latestTask == null ? null : latestTask.getStatus()).equals("ASSIGNED")) {
            return new ShipmentBoardAdvice("COURIER", "ACCEPT_TASK", "Courier task is waiting for acceptance");
        }
        if (normalize(latestTask == null ? null : latestTask.getStatus()).equals("ACCEPTED")) {
            return new ShipmentBoardAdvice("COURIER", "START_ROUTE", "Courier accepted task but has not started route");
        }
        if (normalize(latestTask == null ? null : latestTask.getStatus()).equals("IN_PROGRESS")) {
            return new ShipmentBoardAdvice("COURIER", "COMPLETE_OR_RECORD_ATTEMPT", "Courier is handling the shipment");
        }
        if (status == ShipmentStatus.REDIRECTED_TO_PICKUP) {
            return new ShipmentBoardAdvice("POINT", "ACCEPT_REDIRECTED_SHIPMENT", "Redirected parcel must physically arrive at target point");
        }
        if (status == ShipmentStatus.AWAITING_PICKUP) {
            return new ShipmentBoardAdvice("CLIENT", "PICKUP_AT_POINT", "Shipment is ready for recipient pickup");
        }
        if (status == ShipmentStatus.DELIVERED) {
            return new ShipmentBoardAdvice("SYSTEM", "NONE", null);
        }
        if (status == ShipmentStatus.CANCELED || status == ShipmentStatus.RETURNED) {
            return new ShipmentBoardAdvice("ADMIN", "REVIEW_EXCEPTION", "Shipment flow finished with exception state");
        }
        return new ShipmentBoardAdvice("SYSTEM", "NONE", null);
    }

    private Map<UUID, Payment> getLatestPaymentByShipmentId(List<Payment> payments) {
        return payments.stream()
                .filter(payment -> payment.getShipment() != null && payment.getShipment().getId() != null)
                .sorted(Comparator.comparing(Payment::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toMap(
                        payment -> payment.getShipment().getId(),
                        Function.identity(),
                        (existing, ignored) -> existing,
                        LinkedHashMap::new
                ));
    }

    private PaymentStatus getLatestPaymentStatus(Shipment shipment, Map<UUID, Payment> latestPaymentByShipmentId) {
        Payment payment = latestPaymentByShipmentId.get(shipment.getId());
        return payment == null ? null : payment.getStatus();
    }

    private CourierTask findLatestTaskForShipment(Shipment shipment, List<CourierTask> tasks) {
        return tasks.stream()
                .filter(task -> task.getShipment() != null && shipment.getId().equals(task.getShipment().getId()))
                .sorted(Comparator.comparing(CourierTask::getAssignedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .findFirst()
                .orElse(null);
    }

    private List<User> getCourierUsers(List<CourierTask> tasks) {
        List<User> users = userRepository.findAll();
        Map<UUID, User> courierIdsFromTasks = tasks.stream()
                .map(CourierTask::getCourier)
                .filter(Objects::nonNull)
                .collect(Collectors.toMap(User::getId, Function.identity(), (left, right) -> left, HashMap::new));

        List<User> result = new ArrayList<>();
        for (User user : users) {
            boolean looksLikeCourier = normalize(user.getEmail()).contains("COURIER.");
            if (looksLikeCourier || courierIdsFromTasks.containsKey(user.getId())) {
                result.add(user);
            }
        }
        return result;
    }

    private boolean isCourierFlow(Shipment shipment) {
        return normalize(shipment.getDeliveryType()).equals("COURIER");
    }

    private boolean isTaskOpen(String taskStatus) {
        String normalized = normalize(taskStatus);
        return normalized.equals("ASSIGNED") || normalized.equals("ACCEPTED") || normalized.equals("IN_PROGRESS");
    }

    private String inferCourierServiceCity(User courier, List<CourierTask> courierTasks) {
        String email = normalize(courier.getEmail());
        if (email.contains("WARSAW")) {
            return "WARSAW";
        }
        if (email.contains("KRAKOW")) {
            return "KRAKOW";
        }
        if (email.contains("GDANSK")) {
            return "GDANSK";
        }
        if (email.contains("WROCLAW")) {
            return "WROCLAW";
        }

        return courierTasks.stream()
                .map(CourierTask::getShipment)
                .filter(Objects::nonNull)
                .map(this::getDestinationCity)
                .filter(city -> city != null && !city.isBlank())
                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()))
                .entrySet()
                .stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);
    }

    private boolean matchesCity(String left, String right) {
        return left != null && right != null && left.equalsIgnoreCase(right);
    }

    private String buildDisplayName(User user) {
        String firstName = user.getFirstName() == null ? "" : user.getFirstName().trim();
        String lastName = user.getLastName() == null ? "" : user.getLastName().trim();
        String displayName = (firstName + " " + lastName).trim();
        return displayName.isBlank() ? user.getEmail() : displayName;
    }

    private String getDestinationCity(Shipment shipment) {
        Point point = shipment.getTargetPoint() != null ? shipment.getTargetPoint() : shipment.getCurrentPoint();
        if (point != null && point.getCity() != null && !point.getCity().isBlank()) {
            return point.getCity().trim().toUpperCase(Locale.ROOT);
        }
        return extractCity(shipment.getRecipientAddress());
    }

    private String getPointCode(Point point) {
        return point == null ? null : point.getPointCode();
    }

    private String extractCity(String address) {
        if (address == null || address.isBlank()) {
            return null;
        }
        int commaIndex = address.indexOf(',');
        String city = commaIndex >= 0 ? address.substring(0, commaIndex) : address;
        return city.trim().toUpperCase(Locale.ROOT);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }

    private record ShipmentBoardAdvice(
            String nextActionOwner,
            String nextSuggestedAction,
            String blockedReason
    ) {
    }
}
