package org.example.pocztabackend.repository;

import org.example.pocztabackend.model.CourierTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CourierTaskRepository extends JpaRepository<CourierTask, UUID> {
    List<CourierTask> findAllByCourier_IdOrderByTaskDateAscAssignedAtAsc(UUID courierId);
    List<CourierTask> findAllByShipment_IdOrderByAssignedAtDesc(UUID shipmentId);
}
