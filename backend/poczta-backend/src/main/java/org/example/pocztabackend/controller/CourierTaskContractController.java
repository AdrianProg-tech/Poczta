package org.example.pocztabackend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/courier/tasks")
@Tag(name = "Zadania kuriera", description = "Przeglądanie i aktualizacja zadań dostawczych kuriera")
public class CourierTaskContractController {

    private final CourierTaskContractService courierTaskContractService;

    public CourierTaskContractController(CourierTaskContractService courierTaskContractService) {
        this.courierTaskContractService = courierTaskContractService;
    }

    @GetMapping
    @Operation(summary = "Pobierz listę zadań kuriera")
    public List<CourierTaskListItemResponse> getCourierTasks() {
        return courierTaskContractService.getCourierTasks(null);
    }

    @GetMapping("/{taskId}")
    @Operation(summary = "Pobierz szczegóły zadania kuriera")
    public CourierTaskDetailsResponse getCourierTask(@PathVariable UUID taskId) {
        return courierTaskContractService.getCourierTask(null, taskId);
    }

    @PostMapping("/{taskId}/accept")
    @Operation(summary = "Akceptuj zadanie kuriera")
    public CourierTaskStateChangeResponse acceptCourierTask(@PathVariable UUID taskId) {
        return courierTaskContractService.acceptCourierTask(null, taskId);
    }

    @PostMapping("/{taskId}/start")
    @Operation(summary = "Rozpocznij realizację zadania")
    public CourierTaskStateChangeResponse startCourierTask(@PathVariable UUID taskId) {
        return courierTaskContractService.startCourierTask(null, taskId);
    }

    @PostMapping("/{taskId}/complete-delivery")
    @Operation(summary = "Oznacz dostawę jako zakończoną")
    public CourierTaskStateChangeResponse completeDelivery(
            @PathVariable UUID taskId,
            @Valid @RequestBody CompleteDeliveryRequest request
    ) {
        return courierTaskContractService.completeDelivery(null, taskId, request);
    }

    @PostMapping("/{taskId}/record-attempt")
    @Operation(summary = "Zapisz nieudaną próbę dostawczą")
    public DeliveryAttemptRecordedResponse recordAttempt(
            @PathVariable UUID taskId,
            @Valid @RequestBody RecordDeliveryAttemptRequest request
    ) {
        return courierTaskContractService.recordAttempt(null, taskId, request);
    }
}
