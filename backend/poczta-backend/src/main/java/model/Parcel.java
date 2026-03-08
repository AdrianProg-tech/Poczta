package model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "PARCELS")
@Getter // Automatycznie generuje gettery
@Setter // Automatycznie generuje settery
@NoArgsConstructor // Pusty konstruktor wymagany przez JPA
@AllArgsConstructor // Konstruktor ze wszystkimi polami
public class Parcel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String trackingNumber;

    @Column(nullable = false)
    private String status;

    private String recipientEmail;
}