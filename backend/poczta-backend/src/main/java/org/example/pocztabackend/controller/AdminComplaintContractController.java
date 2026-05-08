package org.example.pocztabackend.controller;

import org.example.pocztabackend.dto.AdminComplaintSummaryResponse;
import org.example.pocztabackend.dto.ComplaintResolutionRequest;
import org.example.pocztabackend.dto.ComplaintStateChangeResponse;
import org.example.pocztabackend.service.AdminComplaintContractService;
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
public class AdminComplaintContractController {

    private final AdminComplaintContractService adminComplaintContractService;

    public AdminComplaintContractController(AdminComplaintContractService adminComplaintContractService) {
        this.adminComplaintContractService = adminComplaintContractService;
    }

    @GetMapping
    public List<AdminComplaintSummaryResponse> listComplaints() {
        return adminComplaintContractService.listComplaints();
    }

    @PostMapping("/{complaintId}/start-review")
    public ComplaintStateChangeResponse startReview(@PathVariable UUID complaintId) {
        return adminComplaintContractService.startReview(complaintId);
    }

    @PostMapping("/{complaintId}/accept")
    public ComplaintStateChangeResponse acceptComplaint(
            @PathVariable UUID complaintId,
            @RequestBody(required = false) ComplaintResolutionRequest request
    ) {
        return adminComplaintContractService.acceptComplaint(complaintId, request);
    }

    @PostMapping("/{complaintId}/reject")
    public ComplaintStateChangeResponse rejectComplaint(
            @PathVariable UUID complaintId,
            @RequestBody(required = false) ComplaintResolutionRequest request
    ) {
        return adminComplaintContractService.rejectComplaint(complaintId, request);
    }

    @PostMapping("/{complaintId}/close")
    public ComplaintStateChangeResponse closeComplaint(@PathVariable UUID complaintId) {
        return adminComplaintContractService.closeComplaint(complaintId);
    }
}
