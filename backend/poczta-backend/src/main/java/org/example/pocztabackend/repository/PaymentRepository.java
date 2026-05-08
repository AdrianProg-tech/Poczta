package org.example.pocztabackend.repository;

import org.example.pocztabackend.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    List<Payment> findAllByShipment_Id(UUID shipmentId);

    List<Payment> findAllByShipment_IdOrderByCreatedAtDesc(UUID shipmentId);

    List<Payment> findAllByShipment_Creator_IdOrderByCreatedAtDesc(UUID creatorId);

    List<Payment> findAllByOrderByCreatedAtDesc();
}
