package org.example.pocztabackend.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "points")
@Data @NoArgsConstructor @AllArgsConstructor
public class Point {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String name;
    private String type; // np. PARCEL_LOCKER, PICKUP_POINT
    private String city;
    private String address;
    private String postalCode;
    private boolean isActive;
}
