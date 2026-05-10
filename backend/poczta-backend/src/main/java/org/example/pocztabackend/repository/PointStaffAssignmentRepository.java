package org.example.pocztabackend.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.example.pocztabackend.model.PointStaffAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PointStaffAssignmentRepository extends JpaRepository<PointStaffAssignment, UUID> {
    List<PointStaffAssignment> findAllByUser_IdAndActiveTrue(UUID userId);

    Optional<PointStaffAssignment> findFirstByUser_IdAndActiveTrueOrderByPrimaryAssignmentDescIdAsc(UUID userId);
}
