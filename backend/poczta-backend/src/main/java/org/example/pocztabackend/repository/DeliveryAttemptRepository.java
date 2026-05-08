package org.example.pocztabackend.repository;

import org.example.pocztabackend.model.DeliveryAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DeliveryAttemptRepository extends JpaRepository<DeliveryAttempt, UUID> {
    List<DeliveryAttempt> findAllByShipment_IdOrderByAttemptTimeDesc(UUID shipmentId);
}
