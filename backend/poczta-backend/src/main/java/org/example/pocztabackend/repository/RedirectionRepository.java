package org.example.pocztabackend.repository;

import org.example.pocztabackend.model.Redirection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface RedirectionRepository extends JpaRepository<Redirection, UUID> {
}
