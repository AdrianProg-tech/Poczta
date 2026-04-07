package org.example.pocztabackend.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;
import java.util.List;

@Entity
@Table(name = "lockers")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Locker {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String code;
    private int totalCompartments;
    private int availableCompartments;

    @ManyToOne
    @JoinColumn(name = "point_id")
    private Point point;

    @OneToMany(mappedBy = "locker", cascade = CascadeType.ALL)
    private List<LockerCompartment> compartments;
}