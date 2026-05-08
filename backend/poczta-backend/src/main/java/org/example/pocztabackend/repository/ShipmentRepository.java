package org.example.pocztabackend.repository;

import org.example.pocztabackend.model.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;
import java.util.List;

@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, UUID> {
    Optional<Shipment> findByTrackingNumber(String trackingNumber);

    boolean existsByTrackingNumber(String trackingNumber);

    List<Shipment> findAllByCreator_IdOrderByCreatedAtDesc(UUID creatorId);

    Optional<Shipment> findByTrackingNumberAndCreator_Id(String trackingNumber, UUID creatorId);
}
