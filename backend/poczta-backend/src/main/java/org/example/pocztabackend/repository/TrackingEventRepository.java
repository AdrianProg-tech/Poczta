package org.example.pocztabackend.repository;

import org.example.pocztabackend.model.enums.ShipmentStatus;
import org.example.pocztabackend.model.TrackingEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TrackingEventRepository extends JpaRepository<TrackingEvent, UUID> {

    List<TrackingEvent> findAllByShipment_IdOrderByEventTimeDesc(UUID shipmentId);
}