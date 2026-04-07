package org.example.pocztabackend.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "payments")
@Data @NoArgsConstructor @AllArgsConstructor
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private BigDecimal amount;
    private String method; // ONLINE, COD, etc.
    private String status;
    private String externalReference;
    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "shipment_id")
    private Shipment shipment;
}