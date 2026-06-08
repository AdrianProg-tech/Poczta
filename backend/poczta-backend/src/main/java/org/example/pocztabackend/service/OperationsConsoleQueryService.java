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

import java.text.Normalizer;
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
    private final ShipmentRoutingService shipmentRoutingService;

    public OperationsConsoleQueryService(
            ShipmentRepository shipmentRepository,
            PaymentRepository paymentRepository,
            CourierTaskRepository courierTaskRepository,
            ComplaintRepository complaintRepository,
            TrackingEventRepository trackingEventRepository,
            UserRepository userRepository,
            ShipmentRoutingService shipmentRoutingService
    ) {
        this.shipmentRepository = shipmentRepository;
        this.paymentRepository = paymentRepository;
        this.courierTaskRepository = courierTaskRepository;
        this.complaintRepository = complaintRepository;
        this.trackingEventRepository = trackingEventRepository;
        this.userRepository = userRepository;
        this.shipmentRoutingService = shipmentRoutingService;
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
                .filter(shipment -> findLatestOpenTaskForShipment(shipment, courierTasks) == null)
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
        Map<UUID, Payment> latestPaymentByShipmentId = getLatestPaymentByShipmentId(paymentRepository.findAll());
        List<User> courierUsers = getCourierUsers(tasks);

        List<OpsCourierSummaryResponse> courierSummaries = courierUsers.stream()
                .map(courier -> toCourierSummary(courier, tasks))
                .sorted(Comparator.comparing(OpsCourierSummaryResponse::courierEmail, Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();

        List<OpsDispatchCandidateResponse> pendingAssignments = shipments.stream()
                .filter(shipment -> {
                    CourierTask latestTask = findLatestOpenTaskForShipment(shipment, tasks);
                    if (latestTask != null) {
                        return false;
                    }
                    ShipmentRoutingSnapshot routing = shipmentRoutingService.snapshot(
                            shipment,
                            latestPaymentByShipmentId.get(shipment.getId()),
                            null
                    );
                    return shouldSuggestCourierAssignment(shipment, latestPaymentByShipmentId.get(shipment.getId()), routing);
                })
                .map(shipment -> toDispatchCandidate(shipment, courierSummaries, null))
                .toList();

        List<OpsReassignmentCandidateResponse> reassignmentCandidates = shipments.stream()
                .map(shipment -> new AbstractMap.SimpleEntry<>(shipment, findLatestOpenTaskForShipment(shipment, tasks)))
                .filter(entry -> entry.getValue() != null)
                .filter(entry -> {
                    ShipmentRoutingSnapshot routing = shipmentRoutingService.snapshot(
                            entry.getKey(),
                            latestPaymentByShipmentId.get(entry.getKey().getId()),
                            entry.getValue()
                    );
                    return shouldSuggestCourierAssignment(entry.getKey(), latestPaymentByShipmentId.get(entry.getKey().getId()), routing);
                })
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
        CourierTask latestTask = findLatestOpenTaskForShipment(shipment, tasks);
        ShipmentRoutingSnapshot routing = shipmentRoutingService.snapshot(shipment, latestPayment, latestTask);
        ShipmentBoardAdvice advice = getShipmentBoardAdvice(shipment, latestPayment, latestTask, routing);

        return new OpsShipmentBoardItemResponse(
                shipment.getId(),
                shipment.getTrackingNumber(),
                routing.shipmentRouteStatus(),
                shipment.getStatus() == null ? null : shipment.getStatus().name(),
                latestPayment == null || latestPayment.getStatus() == null ? null : latestPayment.getStatus().name(),
                shipment.getDeliveryType(),
                routing.intakeMethod(),
                routing.deliveryMethod(),
                extractCity(shipment.getSenderAddress()),
                getDestinationCity(shipment),
                getPointCode(shipment.getSourcePoint()),
                getPointCode(shipment.getTargetPoint()),
                routing.currentNodeType(),
                routing.currentNodeCode(),
                latestTask == null || latestTask.getCourier() == null ? null : latestTask.getCourier().getEmail(),
                taskType(latestTask),
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
        String operationalCity = getOperationalCourierCity(shipment);
        OpsCourierSummaryResponse suggestedCourier = suggestCourier(courierSummaries, operationalCity, excludedCourierId);

        String suggestionReason = suggestedCourier == null
                ? "Brak dostępnych profili kurierów"
                : matchesCity(suggestedCourier.inferredServiceCity(), operationalCity)
                ? "Najlepsze dopasowanie według miasta i najmniejszej liczby otwartych zadań"
                : "Zapasowa sugestia według najmniejszej liczby otwartych zadań";

        return new OpsDispatchCandidateResponse(
                shipment.getId(),
                shipment.getTrackingNumber(),
                operationalCity,
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

    private ShipmentBoardAdvice getShipmentBoardAdvice(
            Shipment shipment,
            Payment latestPayment,
            CourierTask latestTask,
            ShipmentRoutingSnapshot routing
    ) {
        ShipmentStatus status = shipment.getStatus();
        PaymentStatus paymentStatus = latestPayment == null ? null : latestPayment.getStatus();

        if (paymentStatus == PaymentStatus.PENDING) {
            return new ShipmentBoardAdvice("ADMIN", "MARK_PAYMENT_PAID", "Oczekiwanie na potwierdzenie płatności online");
        }
        if (paymentStatus == PaymentStatus.FAILED) {
            return new ShipmentBoardAdvice("CLIENT", "RESTART_PAYMENT", "Ostatnia płatność zakończyła się niepowodzeniem");
        }
        if (paymentStatus == PaymentStatus.OFFLINE_PENDING
                && isCourierOfflineCollection(latestPayment)
                && "OUT_FOR_DELIVERY".equals(routing.shipmentRouteStatus())
                && "IN_PROGRESS".equals(normalize(latestTask == null ? null : latestTask.getStatus()))
                && !"PICKUP".equals(taskType(latestTask))) {
            return new ShipmentBoardAdvice("COURIER", "COLLECT_PAYMENT_AND_DELIVER", "Kurier musi pobrać gotówkę lub kartę przy doręczeniu");
        }
        if (paymentStatus == PaymentStatus.OFFLINE_PENDING && !isCourierOfflineCollection(latestPayment)) {
            return new ShipmentBoardAdvice("POINT", "CONFIRM_OFFLINE_PAYMENT", "Oczekiwanie na potwierdzenie płatności offline w punkcie");
        }
        if ("READY_FOR_HANDOVER".equals(routing.shipmentRouteStatus()) && "COURIER_PICKUP".equals(routing.intakeMethod())) {
            if (!isPickupPaymentReady(latestPayment)) {
                return new ShipmentBoardAdvice("CLIENT", "MARK_PAYMENT_PAID", "Przesyłka wciąż wymaga płatności przed zorganizowaniem odbioru przez kuriera");
            }
            String latestTaskStatus = normalize(latestTask == null ? null : latestTask.getStatus());
            if (latestTask == null) {
                return new ShipmentBoardAdvice("DISPATCH", "ASSIGN_PICKUP_COURIER", "Trzeba przypisać kuriera do odbioru przesyłki od nadawcy");
            }
            if ("ASSIGNED".equals(latestTaskStatus)) {
                return new ShipmentBoardAdvice("COURIER", "ACCEPT_PICKUP_TASK", "Kurier powinien potwierdzić odbiór zadania pick-up");
            }
            if ("ACCEPTED".equals(latestTaskStatus)) {
                return new ShipmentBoardAdvice("COURIER", "START_PICKUP_ROUTE", "Kurier przyjął zadanie pick-up, ale jeszcze nie rozpoczął trasy");
            }
            if ("IN_PROGRESS".equals(latestTaskStatus)) {
                return new ShipmentBoardAdvice("COURIER", "COMPLETE_PICKUP_FROM_SENDER", "Kurier jest w trasie po odbiór przesyłki od nadawcy");
            }
        }
        if ("READY_FOR_HANDOVER".equals(routing.shipmentRouteStatus())) {
            return new ShipmentBoardAdvice("POINT", "PREPARE_FOR_DISPATCH", "Przesyłka jest opłacona i czeka na przekazanie w punkcie nadania");
        }
        if ("ACCEPTED_AT_SOURCE".equals(routing.shipmentRouteStatus())) {
            return new ShipmentBoardAdvice("POINT", "POST_FROM_SOURCE", "Punkt przyjął przesyłkę i powinien nadać ją dalej do sieci");
        }
        if ("AT_DESTINATION_HUB".equals(routing.shipmentRouteStatus())
                && "COURIER_HOME".equals(routing.deliveryMethod())
                && latestTask == null) {
            return new ShipmentBoardAdvice("DISPATCH", "ASSIGN_COURIER", "Kurier nie został jeszcze przypisany");
        }
        if ("AT_DESTINATION_HUB".equals(routing.shipmentRouteStatus())
                && routesIntoPickupPoint(shipment, routing)) {
            return new ShipmentBoardAdvice("HUB", "ROUTE_TO_PICKUP_POINT", "Hub docelowy powinien skierować tę przesyłkę do punktu odbioru");
        }
        if ("RETURN_IN_TRANSIT".equals(routing.shipmentRouteStatus())
                && routesIntoPickupPoint(shipment, routing)) {
            return new ShipmentBoardAdvice("HUB", "ROUTE_TO_PICKUP_POINT", "Przekierowana przesyłka wróciła do hubu i musi zostać wysłana do punktu odbioru");
        }
        if (normalize(latestTask == null ? null : latestTask.getStatus()).equals("ASSIGNED")) {
            return new ShipmentBoardAdvice("COURIER", "ACCEPT_TASK", "Zadanie kuriera czeka na przyjęcie");
        }
        if (normalize(latestTask == null ? null : latestTask.getStatus()).equals("ACCEPTED")) {
            return new ShipmentBoardAdvice("COURIER", "START_ROUTE", "Kurier przyjął zadanie, ale jeszcze nie rozpoczął trasy");
        }
        if (normalize(latestTask == null ? null : latestTask.getStatus()).equals("IN_PROGRESS")) {
            return new ShipmentBoardAdvice("COURIER", "COMPLETE_OR_RECORD_ATTEMPT", "Kurier jest w trakcie obsługi przesyłki");
        }
        if ("IN_TRANSIT_TO_TARGET_POINT".equals(routing.shipmentRouteStatus())) {
            return new ShipmentBoardAdvice("POINT", "ACCEPT_REDIRECTED_SHIPMENT", "Przekierowana przesyłka musi fizycznie dotrzeć do punktu odbioru");
        }
        if ("AWAITING_PICKUP".equals(routing.shipmentRouteStatus())) {
            return new ShipmentBoardAdvice("CLIENT", "PICKUP_AT_POINT", "Przesyłka jest gotowa do odbioru przez klienta");
        }
        if ("DELIVERED".equals(routing.shipmentRouteStatus())) {
            return new ShipmentBoardAdvice("SYSTEM", "NONE", null);
        }
        if ("CANCELED".equals(routing.shipmentRouteStatus()) || "RETURNED".equals(routing.shipmentRouteStatus())) {
            return new ShipmentBoardAdvice("ADMIN", "REVIEW_EXCEPTION", "Obsługa przesyłki zakończyła się stanem wyjątkowym");
        }
        return new ShipmentBoardAdvice("SYSTEM", "NONE", null);
    }

    private boolean routesIntoPickupPoint(Shipment shipment, ShipmentRoutingSnapshot routing) {
        return "PICKUP_POINT".equals(routing.deliveryMethod()) || shipment.getTargetPoint() != null;
    }

    private boolean shouldSuggestCourierAssignment(Shipment shipment, Payment latestPayment, ShipmentRoutingSnapshot routing) {
        return ("AT_DESTINATION_HUB".equals(routing.shipmentRouteStatus())
                && "COURIER_HOME".equals(routing.deliveryMethod())
                && isCourierFlow(shipment))
                || ("READY_FOR_HANDOVER".equals(routing.shipmentRouteStatus())
                && "COURIER_PICKUP".equals(routing.intakeMethod())
                && isPickupPaymentReady(latestPayment));
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

    private CourierTask findLatestOpenTaskForShipment(Shipment shipment, List<CourierTask> tasks) {
        return tasks.stream()
                .filter(task -> task.getShipment() != null && shipment.getId().equals(task.getShipment().getId()))
                .filter(task -> isTaskOpen(task.getStatus()))
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

    private String taskType(CourierTask task) {
        if (task == null || task.getTaskType() == null || task.getTaskType().isBlank()) {
            return null;
        }
        return task.getTaskType().trim().toUpperCase(Locale.ROOT);
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
        String normalizedLeft = canonicalizeCity(left);
        String normalizedRight = canonicalizeCity(right);
        return normalizedLeft != null && normalizedLeft.equals(normalizedRight);
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

    private String getOperationalCourierCity(Shipment shipment) {
        String intakeMethod = normalize(shipment.getIntakeMethod());
        if ("COURIER_PICKUP".equals(intakeMethod)) {
            return extractCity(shipment.getSenderAddress());
        }
        return getDestinationCity(shipment);
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

    private String canonicalizeCity(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String normalized = Normalizer.normalize(value.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toUpperCase(Locale.ROOT);

        return switch (normalized) {
            case "WARSZAWA", "WARSAW" -> "WARSAW";
            case "KRAKOW", "CRACOW" -> "KRAKOW";
            case "GDANSK" -> "GDANSK";
            case "WROCLAW" -> "WROCLAW";
            case "POZNAN" -> "POZNAN";
            default -> normalized;
        };
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }

    private boolean isCourierOfflineCollection(Payment payment) {
        return payment != null && "OFFLINE_AT_COURIER".equalsIgnoreCase(payment.getMethod());
    }

    private boolean isPickupPaymentReady(Payment payment) {
        if (payment == null || payment.getStatus() == null) {
            return false;
        }
        if (payment.getStatus() == PaymentStatus.PAID || payment.getStatus() == PaymentStatus.OFFLINE_CONFIRMED) {
            return true;
        }
        return payment.getStatus() == PaymentStatus.OFFLINE_PENDING && isCourierOfflineCollection(payment);
    }

    private record ShipmentBoardAdvice(
            String nextActionOwner,
            String nextSuggestedAction,
            String blockedReason
    ) {
    }
}
