package org.example.pocztabackend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.example.pocztabackend.dto.AdminComplaintSummaryResponse;
import org.example.pocztabackend.dto.ComplaintAttachmentResponse;
import org.example.pocztabackend.dto.ComplaintResolutionRequest;
import org.example.pocztabackend.dto.ComplaintStateChangeResponse;
import org.example.pocztabackend.service.AdminComplaintContractService;
import org.example.pocztabackend.service.OperationalActorResolver;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/complaints")
@Tag(name = "Reklamacje (admin)", description = "Przeglądanie i rozpatrywanie reklamacji przez administratora")
public class AdminComplaintContractController {

    private final AdminComplaintContractService adminComplaintContractService;
    private final OperationalActorResolver operationalActorResolver;

    public AdminComplaintContractController(
            AdminComplaintContractService adminComplaintContractService,
            OperationalActorResolver operationalActorResolver
    ) {
        this.adminComplaintContractService = adminComplaintContractService;
        this.operationalActorResolver = operationalActorResolver;
    }

    @GetMapping
    @Operation(summary = "Pobierz listę wszystkich reklamacji")
    public List<AdminComplaintSummaryResponse> listComplaints() {
        operationalActorResolver.requireAdminActor(false);
        return adminComplaintContractService.listComplaints();
    }

    @PostMapping("/{complaintId}/start-review")
    @Operation(summary = "Rozpocznij rozpatrywanie reklamacji")
    public ComplaintStateChangeResponse startReview(@PathVariable UUID complaintId) {
        operationalActorResolver.requireAdminActor(false);
        return adminComplaintContractService.startReview(complaintId);
    }

    @PostMapping("/{complaintId}/accept")
    @Operation(summary = "Zaakceptuj reklamację")
    public ComplaintStateChangeResponse acceptComplaint(
            @PathVariable UUID complaintId,
            @RequestBody(required = false) ComplaintResolutionRequest request
    ) {
        operationalActorResolver.requireAdminActor(false);
        return adminComplaintContractService.acceptComplaint(complaintId, request);
    }

    @PostMapping("/{complaintId}/reject")
    @Operation(summary = "Odrzuć reklamację")
    public ComplaintStateChangeResponse rejectComplaint(
            @PathVariable UUID complaintId,
            @RequestBody(required = false) ComplaintResolutionRequest request
    ) {
        operationalActorResolver.requireAdminActor(false);
        return adminComplaintContractService.rejectComplaint(complaintId, request);
    }

    @PostMapping("/{complaintId}/close")
    @Operation(summary = "Zamknij reklamację")
    public ComplaintStateChangeResponse closeComplaint(@PathVariable UUID complaintId) {
        operationalActorResolver.requireAdminActor(false);
        return adminComplaintContractService.closeComplaint(complaintId);
    }

    @GetMapping("/{complaintId}/attachments")
    @Operation(summary = "Pobierz listę załączników reklamacji")
    public List<ComplaintAttachmentResponse> listAttachments(@PathVariable UUID complaintId) {
        operationalActorResolver.requireAdminActor(false);
        return adminComplaintContractService.listAttachments(complaintId);
    }
}
