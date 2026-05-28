package org.example.pocztabackend.repository;

import org.example.pocztabackend.model.Notice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NoticeRepository extends JpaRepository<Notice, UUID> {
    List<Notice> findAllByShipment_IdOrderByIssuedAtDesc(UUID shipmentId);
}
