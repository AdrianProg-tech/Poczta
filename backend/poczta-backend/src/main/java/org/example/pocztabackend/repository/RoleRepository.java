package org.example.pocztabackend.repository;

import java.util.Optional;
import java.util.UUID;
import org.example.pocztabackend.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RoleRepository extends JpaRepository<Role, UUID> {
    Optional<Role> findByName(String name);
}
