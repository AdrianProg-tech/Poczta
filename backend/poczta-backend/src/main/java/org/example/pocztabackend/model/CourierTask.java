package org.example.pocztabackend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "courier_tasks")
@Data @NoArgsConstructor @AllArgsConstructor
public class CourierTask {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(length = 36)
    private UUID id;

    private LocalDate taskDate;
    private String status;
    private LocalDateTime assignedAt;

    @ManyToOne
    @JoinColumn(name = "courier_id")
    private User courier;
    @ManyToOne
    @JoinColumn(name = "shipment_id")
    private Shipment shipment;
}

