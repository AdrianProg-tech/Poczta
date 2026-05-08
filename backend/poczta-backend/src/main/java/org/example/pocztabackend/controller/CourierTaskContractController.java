package org.example.pocztabackend.controller;

import jakarta.validation.Valid;
import org.example.pocztabackend.dto.CompleteDeliveryRequest;
import org.example.pocztabackend.dto.CourierTaskDetailsResponse;
import org.example.pocztabackend.dto.CourierTaskListItemResponse;
import org.example.pocztabackend.dto.CourierTaskStateChangeResponse;
import org.example.pocztabackend.dto.DeliveryAttemptRecordedResponse;
import org.example.pocztabackend.dto.RecordDeliveryAttemptRequest;
import org.example.pocztabackend.service.CourierTaskContractService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/courier/tasks")
public class CourierTaskContractController {

    private final CourierTaskContractService courierTaskContractService;

    public CourierTaskContractController(CourierTaskContractService courierTaskContractService) {
        this.courierTaskContractService = courierTaskContractService;
    }

    @GetMapping
    public List<CourierTaskListItemResponse> getCourierTasks(
            @RequestHeader(name = "X-Courier-Id") UUID courierId
    ) {
        return courierTaskContractService.getCourierTasks(courierId);
    }

    @GetMapping("/{taskId}")
    public CourierTaskDetailsResponse getCourierTask(@PathVariable UUID taskId) {
        return courierTaskContractService.getCourierTask(taskId);
    }

    @PostMapping("/{taskId}/accept")
    public CourierTaskStateChangeResponse acceptCourierTask(
            @RequestHeader(name = "X-Courier-Id") UUID courierId,
            @PathVariable UUID taskId
    ) {
        return courierTaskContractService.acceptCourierTask(courierId, taskId);
    }

    @PostMapping("/{taskId}/start")
    public CourierTaskStateChangeResponse startCourierTask(
            @RequestHeader(name = "X-Courier-Id") UUID courierId,
            @PathVariable UUID taskId
    ) {
        return courierTaskContractService.startCourierTask(courierId, taskId);
    }

    @PostMapping("/{taskId}/complete-delivery")
    public CourierTaskStateChangeResponse completeDelivery(
            @RequestHeader(name = "X-Courier-Id") UUID courierId,
            @PathVariable UUID taskId,
            @Valid @RequestBody CompleteDeliveryRequest request
    ) {
        return courierTaskContractService.completeDelivery(courierId, taskId, request);
    }

    @PostMapping("/{taskId}/record-attempt")
    public DeliveryAttemptRecordedResponse recordAttempt(
            @RequestHeader(name = "X-Courier-Id") UUID courierId,
            @PathVariable UUID taskId,
            @Valid @RequestBody RecordDeliveryAttemptRequest request
    ) {
        return courierTaskContractService.recordAttempt(courierId, taskId, request);
    }
}
