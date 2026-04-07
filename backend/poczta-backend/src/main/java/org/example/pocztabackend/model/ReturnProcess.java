package org.example.pocztabackend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "return_processes")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ReturnProcess {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String reason;
    private String status;
    private LocalDateTime initiatedAt;

    @ManyToOne
    @JoinColumn(name = "shipment_id")
    private Shipment shipment;

    @ManyToOne
    @JoinColumn(name = "return_to_id")
    private Point returnTo;
}