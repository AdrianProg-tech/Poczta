package org.example.pocztabackend.repository;

import org.example.pocztabackend.model.ReturnProcess;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReturnProcessRepository extends JpaRepository<ReturnProcess, UUID> {
    List<ReturnProcess> findAllByShipment_IdOrderByInitiatedAtDesc(UUID shipmentId);
}
