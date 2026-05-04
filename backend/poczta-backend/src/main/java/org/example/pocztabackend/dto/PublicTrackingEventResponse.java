package org.example.pocztabackend.dto;

//Zrobiłem to w ten sposób, żeby nie wypluwać na zewnątrz całego TrackingEventResponse (bo klient nie potrzebuje UUID ze środka bazy), tylko ładnie sformatowane zdarzenie

import java.time.LocalDateTime;

public record PublicTrackingEventResponse(
        String status,
        String locationName,
        String description,
        LocalDateTime eventTime
) {}
