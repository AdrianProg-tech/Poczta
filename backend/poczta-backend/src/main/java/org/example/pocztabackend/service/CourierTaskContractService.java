package org.example.pocztabackend.service;

import org.example.pocztabackend.dto.AvailableShipmentResponse;
import org.example.pocztabackend.dto.CompleteDeliveryRequest;
import org.example.pocztabackend.dto.CourierTaskDetailsResponse;
import org.example.pocztabackend.dto.CourierTaskListItemResponse;
import org.example.pocztabackend.dto.CourierTaskStateChangeResponse;
import org.example.pocztabackend.dto.DeliveryAttemptRecordedResponse;
import org.example.pocztabackend.dto.InitiateReturnResponse;
import org.example.pocztabackend.dto.IssueNoticeResponse;
import org.example.pocztabackend.dto.RecordDeliveryAttemptRequest;
import org.example.pocztabackend.dto.TrackingHistoryItemResponse;
import org.example.pocztabackend.model.CourierProfile;
import org.example.pocztabackend.model.CourierTask;
import org.example.pocztabackend.model.DeliveryAttempt;
import org.example.pocztabackend.model.Notice;
import org.example.pocztabackend.model.Payment;
import org.example.pocztabackend.model.Point;
import org.example.pocztabackend.model.ReturnProcess;
import org.example.pocztabackend.model.Shipment;
import org.example.pocztabackend.model.TrackingEvent;
import org.example.pocztabackend.model.User;
import org.example.pocztabackend.model.enums.PaymentStatus;
import org.example.pocztabackend.model.enums.ShipmentNodeType;
import org.example.pocztabackend.model.enums.ShipmentRouteStatus;
import org.example.pocztabackend.model.enums.ShipmentStatus;
import org.example.pocztabackend.repository.CourierTaskRepository;
import org.example.pocztabackend.repository.DeliveryAttemptRepository;
import org.example.pocztabackend.repository.NoticeRepository;
import org.example.pocztabackend.repository.PaymentRepository;
import org.example.pocztabackend.repository.PointRepository;
import org.example.pocztabackend.repository.ReturnProcessRepository;
import org.example.pocztabackend.repository.ShipmentRepository;
import org.example.pocztabackend.repository.TrackingEventRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class CourierTaskContractService {

    private final CourierTaskRepository courierTaskRepository;
    private final ShipmentRepository shipmentRepository;
    private final TrackingEventRepository trackingEventRepository;
    private final ShipmentWorkflowService shipmentWorkflowService;
    private final DeliveryAttemptRepository deliveryAttemptRepository;
    private final PointRepository pointRepository;
    private final OperationalActorResolver operationalActorResolver;
    private final PaymentRepository paymentRepository;
    private final PaymentService paymentService;
    private final NoticeRepository noticeRepository;
    private final ReturnProcessRepository returnProcessRepository;
    private final ShipmentRoutingService shipmentRoutingService;

    public CourierTaskContractService(
            CourierTaskRepository courierTaskRepository,
            ShipmentRepository shipmentRepository,
            TrackingEventRepository trackingEventRepository,
            ShipmentWorkflowService shipmentWorkflowService,
            DeliveryAttemptRepository deliveryAttemptRepository,
            PointRepository pointRepository,
            OperationalActorResolver operationalActorResolver,
            PaymentRepository paymentRepository,
            PaymentService paymentService,
            NoticeRepository noticeRepository,
            ReturnProcessRepository returnProcessRepository,
            ShipmentRoutingService shipmentRoutingService
    ) {
        this.courierTaskRepository = courierTaskRepository;
        this.shipmentRepository = shipmentRepository;
        this.trackingEventRepository = trackingEventRepository;
        this.shipmentWorkflowService = shipmentWorkflowService;
        this.deliveryAttemptRepository = deliveryAttemptRepository;
        this.pointRepository = pointRepository;
        this.operationalActorResolver = operationalActorResolver;
        this.paymentRepository = paymentRepository;
        this.paymentService = paymentService;
        this.noticeRepository = noticeRepository;
        this.returnProcessRepository = returnProcessRepository;
        this.shipmentRoutingService = shipmentRoutingService;
    }

    public List<CourierTaskListItemResponse> getCourierTasks(String userEmailHeader) {
        User courier = operationalActorResolver.requireCourierActor(userEmailHeader);

        return courierTaskRepository.findAllByCourier_IdOrderByTaskDateAscAssignedAtAsc(courier.getId()).stream()
                .map(task -> {
                    ShipmentRoutingSnapshot routing = shipmentRoutingService.snapshot(task.getShipment(), getLatestPayment(task.getShipment()), task);
                    return CourierTaskListItemResponse.fromEntity(
                            task,
                            getLatestPayment(task.getShipment()),
                            routing.shipmentRouteStatus(),
                            routing.currentNodeType(),
                            routing.currentNodeCode()
                    );
                })
                .toList();
    }

    public CourierTaskDetailsResponse getCourierTask(String userEmailHeader, UUID taskId) {
        CourierTask task = getTaskForCourier(userEmailHeader, taskId);

        List<TrackingHistoryItemResponse> history = task.getShipment() == null
                ? List.of()
                : trackingEventRepository.findAllByShipment_IdOrderByEventTimeDesc(task.getShipment().getId()).stream()
                .map(TrackingHistoryItemResponse::fromEntity)
                .toList();

        Payment latestPayment = getLatestPayment(task.getShipment());
        ShipmentRoutingSnapshot routing = shipmentRoutingService.snapshot(task.getShipment(), latestPayment, task);
        CourierTaskListItemResponse listItem = CourierTaskListItemResponse.fromEntity(
                task,
                latestPayment,
                routing.shipmentRouteStatus(),
                routing.currentNodeType(),
                routing.currentNodeCode()
        );
        return new CourierTaskDetailsResponse(
                listItem.taskId(),
                listItem.trackingNumber(),
                listItem.taskType(),
                listItem.taskStatus(),
                listItem.shipmentStatus(),
                listItem.legacyShipmentStatus(),
                listItem.recipientName(),
                listItem.recipientPhone(),
                listItem.targetAddress(),
                listItem.currentNodeType(),
                listItem.currentNodeCode(),
                listItem.plannedDate(),
                listItem.paymentStatus(),
                listItem.paymentMethod(),
                listItem.paymentAmount(),
                listItem.paymentCollectionMethod(),
                listItem.requiresPaymentCollection(),
                history
        );
    }

    @Transactional
    public CourierTaskStateChangeResponse acceptCourierTask(String userEmailHeader, UUID taskId) {
        CourierTask task = getTaskForCourier(userEmailHeader, taskId);
        requireTaskStatus(task, "ASSIGNED");
        task.setStatus("ACCEPTED");
        courierTaskRepository.save(task);
        return toStateChangeResponse(task);
    }

    @Transactional
    public CourierTaskStateChangeResponse startCourierTask(String userEmailHeader, UUID taskId) {
        CourierTask task = getTaskForCourier(userEmailHeader, taskId);
        requireTaskStatus(task, "ACCEPTED");

        Shipment shipment = requireShipment(task);
        if (isPickupTask(task)) {
            shipmentRoutingService.applyRouteState(
                    shipment,
                    ShipmentRouteStatus.READY_FOR_HANDOVER,
                    ShipmentNodeType.COURIER,
                    task.getCourier() == null ? "COURIER" : task.getCourier().getEmail()
            );
            shipmentRepository.save(shipment);
            addTrackingEvent(
                    shipment,
                    shipment.getStatus(),
                    "Pickup route",
                    "Courier started route to pick up parcel from sender",
                    LocalDateTime.now()
            );
        } else {
            moveShipmentToOutForDelivery(shipment, task);
        }

        task.setStatus("IN_PROGRESS");
        courierTaskRepository.save(task);
        return toStateChangeResponse(task);
    }

    @Transactional
    public CourierTaskStateChangeResponse completeDelivery(
            String userEmailHeader,
            UUID taskId,
            CompleteDeliveryRequest request
    ) {
        CourierTask task = getTaskForCourier(userEmailHeader, taskId);
        requireTaskStatus(task, "IN_PROGRESS");

        Shipment shipment = requireShipment(task);
        if (isPickupTask(task)) {
            completePickupFromSender(shipment, task, request.deliveredAt(), request.note());
            task.setStatus("COMPLETED");
            courierTaskRepository.save(task);
            return toStateChangeResponse(task);
        }

        moveShipmentToOutForDelivery(shipment, task);
        Payment latestPayment = getLatestPayment(shipment);
        boolean requiresCourierPaymentCollection = requiresCourierPaymentCollection(latestPayment);

        if (requiresCourierPaymentCollection && !Boolean.TRUE.equals(request.collectPayment())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Shipment requires courier payment collection before delivery completion"
            );
        }
        if (!requiresCourierPaymentCollection && Boolean.TRUE.equals(request.collectPayment())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Shipment does not require courier payment collection"
            );
        }

        String deliveryDescription = "Shipment delivered to recipient";
        if (requiresCourierPaymentCollection) {
            var confirmedPayment = paymentService.confirmOfflinePayment(latestPayment.getId(), request.collectionMethod());
            deliveryDescription =
                    "Shipment delivered to recipient. Courier collected offline payment by "
                            + confirmedPayment.collectionMethod();
        }

        shipmentWorkflowService.changeStatus(shipment, ShipmentStatus.DELIVERED);
        shipmentRoutingService.applyRouteState(shipment, ShipmentRouteStatus.DELIVERED, ShipmentNodeType.UNKNOWN, null);
        shipmentRepository.save(shipment);
        addTrackingEvent(
                shipment,
                ShipmentStatus.DELIVERED,
                "Delivered",
                withOptionalNote(deliveryDescription, request.note()),
                request.deliveredAt()
        );

        task.setStatus("COMPLETED");
        courierTaskRepository.save(task);
        return toStateChangeResponse(task);
    }

    @Transactional
    public DeliveryAttemptRecordedResponse recordAttempt(
            String userEmailHeader,
            UUID taskId,
            RecordDeliveryAttemptRequest request
    ) {
        CourierTask task = getTaskForCourier(userEmailHeader, taskId);
        if (isPickupTask(task)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Delivery attempt is only available for last-mile delivery tasks");
        }
        requireTaskStatus(task, "IN_PROGRESS");

        Shipment shipment = requireShipment(task);
        moveShipmentToOutForDelivery(shipment, task);

        DeliveryAttempt attempt = new DeliveryAttempt();
        attempt.setShipment(shipment);
        attempt.setCourier(task.getCourier());
        attempt.setAttemptTime(LocalDateTime.now());
        attempt.setResult(normalizeAttemptResult(request.result()));
        attempt.setComment(request.note());
        DeliveryAttempt savedAttempt = deliveryAttemptRepository.save(attempt);

        shipmentWorkflowService.changeStatus(shipment, ShipmentStatus.DELIVERY_ATTEMPT);
        shipmentRoutingService.applyRouteState(
                shipment,
                ShipmentRouteStatus.DELIVERY_ATTEMPT_FAILED,
                ShipmentNodeType.COURIER,
                task.getCourier() == null ? "COURIER" : task.getCourier().getEmail()
        );
        shipmentRepository.save(shipment);
        addTrackingEvent(
                shipment,
                ShipmentStatus.DELIVERY_ATTEMPT,
                "Delivery attempt",
                withOptionalNote("Delivery attempt failed: " + attempt.getResult(), request.note()),
                attempt.getAttemptTime()
        );

        if (Boolean.TRUE.equals(request.redirectToPickup())) {
            Point redirectPoint = resolveRedirectPoint(shipment, request.redirectPointCode());
            shipment.setTargetPoint(redirectPoint);
            shipment.setCurrentPoint(null);
            shipmentWorkflowService.changeStatus(shipment, ShipmentStatus.REDIRECTED_TO_PICKUP);
            shipmentRoutingService.applyRouteState(
                    shipment,
                    ShipmentRouteStatus.RETURN_IN_TRANSIT,
                    ShipmentNodeType.DESTINATION_HUB,
                    "HUB-" + extractCity(redirectPoint.getCity())
            );
            shipmentRepository.save(shipment);
            addTrackingEvent(
                    shipment,
                    ShipmentStatus.REDIRECTED_TO_PICKUP,
                    "Redirected to pickup",
                    "Shipment returned to destination hub and queued for pickup point " + redirectPoint.getPointCode(),
                    LocalDateTime.now()
            );
        }

        task.setStatus("FAILED");
        courierTaskRepository.save(task);

        return new DeliveryAttemptRecordedResponse(
                task.getId(),
                task.getStatus(),
                shipment.getStatus() == null ? null : shipment.getStatus().name(),
                savedAttempt.getId()
        );
    }

    @Transactional
    public IssueNoticeResponse issueNotice(String userEmailHeader, UUID taskId) {
        CourierTask task = getTaskForCourier(userEmailHeader, taskId);
        if (isPickupTask(task)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Notice can only be issued for last-mile delivery tasks");
        }
        if (!"FAILED".equals(task.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Notice can only be issued for a failed task");
        }

        Shipment shipment = requireShipment(task);
        Point pickupPoint = shipment.getTargetPoint() != null ? shipment.getTargetPoint() : shipment.getCurrentPoint();
        if (pickupPoint == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No pickup point associated with this shipment");
        }

        LocalDateTime now = LocalDateTime.now();
        Notice notice = Notice.builder()
                .noticeNumber("AWZ" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase(Locale.ROOT))
                .issuedAt(now)
                .expiresAt(now.plusDays(7))
                .shipment(shipment)
                .pickupPoint(pickupPoint)
                .build();
        Notice saved = noticeRepository.save(notice);

        addTrackingEvent(
                shipment,
                shipment.getStatus(),
                "Notice issued",
                "Awizo issued. Shipment available at point " + pickupPoint.getPointCode() + " until " + saved.getExpiresAt().toLocalDate(),
                now
        );

        return new IssueNoticeResponse(
                saved.getId(),
                saved.getNoticeNumber(),
                saved.getIssuedAt(),
                saved.getExpiresAt(),
                pickupPoint.getPointCode(),
                shipment.getTrackingNumber()
        );
    }

    @Transactional
    public InitiateReturnResponse initiateReturn(String userEmailHeader, UUID taskId, String reason) {
        CourierTask task = getTaskForCourier(userEmailHeader, taskId);
        if (isPickupTask(task)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Return can only be initiated for last-mile delivery tasks");
        }
        if (!"FAILED".equals(task.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Return can only be initiated for a failed task");
        }

        Shipment shipment = requireShipment(task);
        shipmentRoutingService.applyRouteState(shipment, ShipmentRouteStatus.RETURNED, ShipmentNodeType.RETURN_FLOW, "RETURN-" + extractCity(shipment.getRecipientAddress()));
        shipmentWorkflowService.changeStatus(shipment, ShipmentStatus.RETURNED);
        shipmentRepository.save(shipment);

        LocalDateTime now = LocalDateTime.now();
        ReturnProcess returnProcess = ReturnProcess.builder()
                .reason(reason != null && !reason.isBlank() ? reason.trim() : "Courier failed delivery")
                .status("REQUESTED")
                .initiatedAt(now)
                .shipment(shipment)
                .build();
        ReturnProcess saved = returnProcessRepository.save(returnProcess);

        addTrackingEvent(
                shipment,
                ShipmentStatus.RETURNED,
                "Return initiated",
                "Return process initiated by courier. Reason: " + returnProcess.getReason(),
                now
        );

        return new InitiateReturnResponse(
                saved.getId(),
                saved.getStatus(),
                shipment.getTrackingNumber(),
                ShipmentStatus.RETURNED.name()
        );
    }

    private CourierTask getTaskForCourier(String userEmailHeader, UUID taskId) {
        User courier = operationalActorResolver.requireCourierActor(userEmailHeader);

        CourierTask task = courierTaskRepository.findById(taskId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Courier task not found"));

        if (task.getCourier() == null || !courier.getId().equals(task.getCourier().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Task is not assigned to this courier");
        }

        return task;
    }

    private Shipment requireShipment(CourierTask task) {
        if (task.getShipment() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Courier task has no shipment assigned");
        }
        return task.getShipment();
    }

    private Payment getLatestPayment(Shipment shipment) {
        if (shipment == null || shipment.getId() == null) {
            return null;
        }
        return paymentRepository.findAllByShipment_IdOrderByCreatedAtDesc(shipment.getId()).stream()
                .findFirst()
                .orElse(null);
    }

    private boolean isPickupTask(CourierTask task) {
        return "PICKUP".equalsIgnoreCase(taskType(task));
    }

    private String taskType(CourierTask task) {
        if (task == null || task.getTaskType() == null || task.getTaskType().isBlank()) {
            return "DELIVERY";
        }
        return task.getTaskType().trim().toUpperCase(Locale.ROOT);
    }

    private void requireTaskStatus(CourierTask task, String expectedStatus) {
        String actualStatus = task.getStatus() == null ? null : task.getStatus().trim().toUpperCase(Locale.ROOT);
        if (!expectedStatus.equals(actualStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Invalid courier task transition: expected " + expectedStatus + " but was " + actualStatus
            );
        }
    }

    private CourierTaskStateChangeResponse toStateChangeResponse(CourierTask task) {
        return new CourierTaskStateChangeResponse(
                task.getId(),
                task.getStatus(),
                task.getShipment() == null || task.getShipment().getStatus() == null
                        ? null
                        : task.getShipment().getStatus().name()
        );
    }

    private void moveShipmentToOutForDelivery(Shipment shipment, CourierTask task) {
        ShipmentStatus currentStatus = shipment.getStatus();
        if (currentStatus == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Shipment has no current status");
        }
        ShipmentRoutingSnapshot routing = shipmentRoutingService.snapshot(shipment, getLatestPayment(shipment), task);
        if (currentStatus == ShipmentStatus.OUT_FOR_DELIVERY) {
            return;
        }
        if (!"AT_DESTINATION_HUB".equals(routing.shipmentRouteStatus()) && currentStatus != ShipmentStatus.OUT_FOR_DELIVERY) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Shipment is not ready for courier delivery from route status " + routing.shipmentRouteStatus()
            );
        }
        if (currentStatus != ShipmentStatus.IN_TRANSIT && currentStatus != ShipmentStatus.OUT_FOR_DELIVERY) {
            shipment.setStatus(ShipmentStatus.IN_TRANSIT);
            currentStatus = shipment.getStatus();
        }
        if (currentStatus == ShipmentStatus.IN_TRANSIT) {
            shipmentRoutingService.applyRouteState(
                    shipment,
                    ShipmentRouteStatus.OUT_FOR_DELIVERY,
                    ShipmentNodeType.COURIER,
                    task != null && task.getCourier() != null ? task.getCourier().getEmail() : "COURIER"
            );
            shipmentWorkflowService.changeStatus(shipment, ShipmentStatus.OUT_FOR_DELIVERY);
            shipmentRepository.save(shipment);
            addTrackingEvent(shipment, ShipmentStatus.OUT_FOR_DELIVERY, "Out for delivery", "Courier started the delivery route", LocalDateTime.now());
            return;
        }

        if (shipment.getStatus() != ShipmentStatus.OUT_FOR_DELIVERY) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Shipment is not ready for courier delivery from status " + shipment.getStatus()
            );
        }
    }

    private void completePickupFromSender(
            Shipment shipment,
            CourierTask task,
            LocalDateTime pickupCompletedAt,
            String note
    ) {
        LocalDateTime eventTime = pickupCompletedAt == null ? LocalDateTime.now() : pickupCompletedAt;
        if (shipment.getStatus() == ShipmentStatus.PAID) {
            shipmentWorkflowService.changeStatus(shipment, ShipmentStatus.READY_FOR_POSTING);
        }
        if (shipment.getStatus() == ShipmentStatus.READY_FOR_POSTING) {
            shipmentWorkflowService.changeStatus(shipment, ShipmentStatus.POSTED);
        }
        if (shipment.getStatus() != ShipmentStatus.POSTED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Shipment is not ready to enter linehaul after pickup from sender"
            );
        }

        shipment.setCurrentPoint(null);
        shipmentRoutingService.applyRouteState(
                shipment,
                ShipmentRouteStatus.IN_TRANSIT_TO_DESTINATION_HUB,
                ShipmentNodeType.DESTINATION_HUB,
                "HUB-" + extractCity(shipment.getRecipientAddress())
        );
        shipmentRepository.save(shipment);
        addTrackingEvent(
                shipment,
                ShipmentStatus.POSTED,
                "Courier pickup",
                withOptionalNote("Courier picked up parcel from sender and handed it into the network", note),
                eventTime
        );
    }

    private Point resolveRedirectPoint(Shipment shipment, String redirectPointCode) {
        if (redirectPointCode != null && !redirectPointCode.isBlank()) {
            return pointRepository.findByPointCode(redirectPointCode.trim().toUpperCase(Locale.ROOT))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Redirect point not found"));
        }
        if (shipment.getTargetPoint() != null) {
            return shipment.getTargetPoint();
        }
        if (shipment.getCurrentPoint() != null) {
            return shipment.getCurrentPoint();
        }
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "redirectPointCode is required when no shipment target point exists"
        );
    }

    public List<AvailableShipmentResponse> getAvailableShipments(String userEmailHeader) {
        User courier = operationalActorResolver.requireCourierActor(userEmailHeader);
        CourierProfile profile = operationalActorResolver.getCourierProfile(courier);
        String serviceCity = profile != null ? profile.getServiceCity() : null;

        List<Shipment> candidates = shipmentRepository.findAll().stream()
                .filter(shipment -> isEligibleForCourierClaim(shipment, getLatestPayment(shipment), serviceCity))
                .toList();

        Set<String> activeTaskStatuses = Set.of("ASSIGNED", "ACCEPTED", "IN_PROGRESS");

        return candidates.stream()
                .filter(shipment -> {
                    List<CourierTask> tasks = courierTaskRepository.findAllByShipment_IdOrderByAssignedAtDesc(shipment.getId());
                    boolean hasActiveTask = tasks.stream().anyMatch(t -> activeTaskStatuses.contains(t.getStatus()));
                    if (hasActiveTask) return false;
                    ShipmentRoutingSnapshot routing = shipmentRoutingService.snapshot(shipment, getLatestPayment(shipment), null);
                    return isOperationalCityMatch(serviceCity, shipment, routing);
                })
                .map(shipment -> {
                    ShipmentRoutingSnapshot routing = shipmentRoutingService.snapshot(shipment, getLatestPayment(shipment), null);
                    return AvailableShipmentResponse.fromEntity(
                            shipment,
                            routing.shipmentRouteStatus(),
                            routing.currentNodeType(),
                            routing.currentNodeCode()
                    );
                })
                .toList();
    }

    @Transactional
    public CourierTaskStateChangeResponse claimShipment(String userEmailHeader, UUID shipmentId) {
        User courier = operationalActorResolver.requireCourierActor(userEmailHeader);

        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shipment not found"));

        ShipmentRoutingSnapshot routing = shipmentRoutingService.snapshot(shipment, getLatestPayment(shipment), null);
        if (!canCourierClaim(shipment, routing)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Shipment is not available for claiming");
        }

        Set<String> activeTaskStatuses = Set.of("ASSIGNED", "ACCEPTED", "IN_PROGRESS");
        List<CourierTask> existingTasks = courierTaskRepository.findAllByShipment_IdOrderByAssignedAtDesc(shipmentId);
        boolean hasActiveTask = existingTasks.stream().anyMatch(t -> activeTaskStatuses.contains(t.getStatus()));
        if (hasActiveTask) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Shipment already has an active courier task");
        }

        CourierTask task = new CourierTask();
        task.setShipment(shipment);
        task.setCourier(courier);
        task.setTaskType(determineClaimTaskType(shipment, routing));
        task.setStatus("ASSIGNED");
        task.setTaskDate(LocalDate.now());
        task.setAssignedAt(LocalDateTime.now());
        courierTaskRepository.save(task);

        if (isPickupTask(task)) {
            shipmentRoutingService.applyRouteState(
                    shipment,
                    ShipmentRouteStatus.READY_FOR_HANDOVER,
                    ShipmentNodeType.COURIER,
                    courier.getEmail()
            );
            shipmentRepository.save(shipment);
        }

        addTrackingEvent(shipment, shipment.getStatus(), "Courier dispatch",
                "Shipment claimed by courier " + courier.getEmail() + " for " + taskType(task).toLowerCase(Locale.ROOT), LocalDateTime.now());

        return toStateChangeResponse(task);
    }

    private boolean canCourierClaim(Shipment shipment, ShipmentRoutingSnapshot routing) {
        return ("AT_DESTINATION_HUB".equals(routing.shipmentRouteStatus()) && "COURIER_HOME".equals(routing.deliveryMethod()))
                || ("READY_FOR_HANDOVER".equals(routing.shipmentRouteStatus()) && "COURIER_PICKUP".equals(routing.intakeMethod()) && isPickupPaymentReady(getLatestPayment(shipment)));
    }

    private String determineClaimTaskType(Shipment shipment, ShipmentRoutingSnapshot routing) {
        if ("READY_FOR_HANDOVER".equals(routing.shipmentRouteStatus()) && "COURIER_PICKUP".equals(routing.intakeMethod())) {
            return "PICKUP";
        }
        return "DELIVERY";
    }

    private boolean isEligibleForCourierClaim(Shipment shipment, Payment latestPayment, String serviceCity) {
        ShipmentRoutingSnapshot routing = shipmentRoutingService.snapshot(shipment, latestPayment, null);
        if (!canCourierClaim(shipment, routing)) {
            return false;
        }
        return isOperationalCityMatch(serviceCity, shipment, routing);
    }

    private boolean isOperationalCityMatch(String serviceCity, Shipment shipment, ShipmentRoutingSnapshot routing) {
        if (serviceCity == null || serviceCity.isBlank()) {
            return true;
        }
        String relevantCity = "COURIER_PICKUP".equals(routing.intakeMethod()) && "READY_FOR_HANDOVER".equals(routing.shipmentRouteStatus())
                ? extractCity(shipment.getSenderAddress())
                : extractCity(shipment.getRecipientAddress());
        return serviceCity.equalsIgnoreCase(relevantCity);
    }

    private boolean isPickupPaymentReady(Payment payment) {
        if (payment == null || payment.getStatus() == null) {
            return false;
        }
        if (payment.getStatus() == PaymentStatus.PAID || payment.getStatus() == PaymentStatus.OFFLINE_CONFIRMED) {
            return true;
        }
        return payment.getStatus() == PaymentStatus.OFFLINE_PENDING
                && payment.getMethod() != null
                && "OFFLINE_AT_COURIER".equalsIgnoreCase(payment.getMethod());
    }

    private String extractCity(String address) {
        if (address == null || address.isBlank()) return null;
        int commaIndex = address.indexOf(',');
        String city = commaIndex >= 0 ? address.substring(0, commaIndex) : address;
        return city.trim();
    }

    private void addTrackingEvent(
            Shipment shipment,
            ShipmentStatus status,
            String locationName,
            String description,
            LocalDateTime eventTime
    ) {
        TrackingEvent event = new TrackingEvent();
        event.setShipment(shipment);
        event.setStatus(status.name());
        event.setLocationName(locationName);
        event.setDescription(description);
        event.setEventTime(eventTime);
        trackingEventRepository.save(event);
    }

    private boolean requiresCourierPaymentCollection(Payment payment) {
        return payment != null
                && payment.getStatus() == PaymentStatus.OFFLINE_PENDING
                && payment.getMethod() != null
                && "OFFLINE_AT_COURIER".equalsIgnoreCase(payment.getMethod());
    }

    private String withOptionalNote(String baseMessage, String note) {
        if (note == null || note.isBlank()) {
            return baseMessage;
        }
        return baseMessage + ". Note: " + note.trim();
    }

    private String normalizeAttemptResult(String result) {
        return result == null ? "OTHER" : result.trim().toUpperCase(Locale.ROOT);
    }
}
