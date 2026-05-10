package org.example.pocztabackend.repository;

import java.util.Optional;
import java.util.UUID;
import org.example.pocztabackend.model.CourierProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CourierProfileRepository extends JpaRepository<CourierProfile, UUID> {
    Optional<CourierProfile> findByUser_Id(UUID userId);
}
