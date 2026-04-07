package org.example.pocztabackend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tracking_events")
@Data @NoArgsConstructor @AllArgsConstructor
public class TrackingEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String status;
    private String description;
    private LocalDateTime eventTime;
    private String locationName;

    @ManyToOne
    @JoinColumn(name = "shipment_id")
    private Shipment shipment;
}