package org.example.pocztabackend.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "locker_compartments")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class LockerCompartment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String compartmentNumber;
    private String sizeType;
    private String status;

    @ManyToOne
    @JoinColumn(name = "locker_id")
    private Locker locker;
}