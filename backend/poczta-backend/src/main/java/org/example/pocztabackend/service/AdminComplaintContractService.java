package org.example.pocztabackend.service;

import org.example.pocztabackend.dto.AdminComplaintSummaryResponse;
import org.example.pocztabackend.dto.ComplaintResolutionRequest;
import org.example.pocztabackend.dto.ComplaintStateChangeResponse;
import org.example.pocztabackend.model.Complaint;
import org.example.pocztabackend.model.enums.ComplaintStatus;
import org.example.pocztabackend.repository.ComplaintRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class AdminComplaintContractService {

    private final ComplaintRepository complaintRepository;

    public AdminComplaintContractService(ComplaintRepository complaintRepository) {
        this.complaintRepository = complaintRepository;
    }

    public List<AdminComplaintSummaryResponse> listComplaints() {
        return complaintRepository.findAllByOrderBySubmittedAtDesc().stream()
                .map(AdminComplaintSummaryResponse::fromEntity)
                .toList();
    }

    @Transactional
    public ComplaintStateChangeResponse startReview(UUID complaintId) {
        Complaint complaint = getComplaint(complaintId);
        if (complaint.getStatus() != ComplaintStatus.SUBMITTED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only submitted complaints can enter review");
        }

        complaint.setStatus(ComplaintStatus.IN_REVIEW);
        complaint.setReviewedAt(LocalDateTime.now());
        complaintRepository.save(complaint);
        return toResponse(complaint);
    }

    @Transactional
    public ComplaintStateChangeResponse acceptComplaint(UUID complaintId, ComplaintResolutionRequest request) {
        Complaint complaint = getComplaint(complaintId);
        if (complaint.getStatus() != ComplaintStatus.IN_REVIEW) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only complaints in review can be accepted");
        }

        complaint.setStatus(ComplaintStatus.ACCEPTED);
        complaint.setResolutionNote(request == null ? null : request.resolutionNote());
        complaintRepository.save(complaint);
        return toResponse(complaint);
    }

    @Transactional
    public ComplaintStateChangeResponse rejectComplaint(UUID complaintId, ComplaintResolutionRequest request) {
        Complaint complaint = getComplaint(complaintId);
        if (complaint.getStatus() != ComplaintStatus.IN_REVIEW) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only complaints in review can be rejected");
        }

        complaint.setStatus(ComplaintStatus.REJECTED);
        complaint.setResolutionNote(request == null ? null : request.resolutionNote());
        complaintRepository.save(complaint);
        return toResponse(complaint);
    }

    @Transactional
    public ComplaintStateChangeResponse closeComplaint(UUID complaintId) {
        Complaint complaint = getComplaint(complaintId);
        if (complaint.getStatus() != ComplaintStatus.ACCEPTED && complaint.getStatus() != ComplaintStatus.REJECTED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only accepted or rejected complaints can be closed");
        }

        complaint.setStatus(ComplaintStatus.CLOSED);
        complaint.setClosedAt(LocalDateTime.now());
        complaintRepository.save(complaint);
        return toResponse(complaint);
    }

    private Complaint getComplaint(UUID complaintId) {
        return complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Complaint not found"));
    }

    private ComplaintStateChangeResponse toResponse(Complaint complaint) {
        return new ComplaintStateChangeResponse(
                complaint.getId(),
                complaint.getComplaintNumber(),
                complaint.getStatus() == null ? null : complaint.getStatus().name(),
                complaint.getResolutionNote()
        );
    }
}
