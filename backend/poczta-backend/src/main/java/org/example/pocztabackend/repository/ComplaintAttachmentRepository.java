package org.example.pocztabackend.repository;

import org.example.pocztabackend.model.ComplaintAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ComplaintAttachmentRepository extends JpaRepository<ComplaintAttachment, UUID> {
    List<ComplaintAttachment> findAllByComplaint_IdOrderByUploadedAtDesc(UUID complaintId);
}
