package org.example.pocztabackend.model;

import jakarta.persistence.*;
import lombok.*;
import org.example.pocztabackend.model.enums.ComplaintStatus;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "complaints")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Complaint {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String complaintNumber;
    private String type;

    @Enumerated(EnumType.STRING)
    private ComplaintStatus status;

    @Lob
    private String description;

    private LocalDateTime submittedAt;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "shipment_id")
    private Shipment shipment;
}