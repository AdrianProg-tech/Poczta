package org.example.pocztabackend.model;

import jakarta.persistence.*;
import lombok.*;
import org.example.pocztabackend.model.enums.ShipmentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "shipments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Shipment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true)
    private String trackingNumber;

    @Enumerated(EnumType.STRING)
    private ShipmentStatus status;
    private String senderName;
    private String senderPhone;
    private String recipientName;
    private String recipientPhone;
    private String deliveryType;
    private BigDecimal weight;
    private String sizeCategory;
    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "creator_id")
    private User creator;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "label_id")
    private Label label;

    @OneToMany(mappedBy = "shipment", cascade = CascadeType.ALL)
    private List<TrackingEvent> trackingEvents;

    @ManyToOne
    @JoinColumn(name = "current_point_id")
    private Point currentPoint;
}