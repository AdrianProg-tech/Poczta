package org.example.pocztabackend.repository;

import org.example.pocztabackend.model.Point;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PointRepository extends JpaRepository<Point, UUID> {
}
