package org.example.pocztabackend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "notices")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Notice {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(length = 36)
    private UUID id;

    private String noticeNumber;
    private LocalDateTime issuedAt;
    private LocalDateTime expiresAt;

    @ManyToOne
    @JoinColumn(name = "shipment_id")
    private Shipment shipment;

    @ManyToOne
    @JoinColumn(name = "pickup_point_id")
    private Point pickupPoint;
}

