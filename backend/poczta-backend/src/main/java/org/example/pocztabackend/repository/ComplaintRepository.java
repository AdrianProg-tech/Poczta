package org.example.pocztabackend.repository;

import org.example.pocztabackend.model.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, UUID> {
    List<Complaint> findAllByShipment_Id(UUID shipmentId);

    List<Complaint> findAllByUser_Id(UUID userId);

    List<Complaint> findAllByUser_IdOrderBySubmittedAtDesc(UUID userId);

    List<Complaint> findAllByOrderBySubmittedAtDesc();
}
