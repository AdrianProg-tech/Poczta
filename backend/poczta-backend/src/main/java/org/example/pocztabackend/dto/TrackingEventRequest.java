package org.example.pocztabackend.dto;
import java.util.UUID;

public record TrackingEventRequest(
        UUID shipmentId,       // ID paczki, którą skanujemy
        String status,         // Np. "W_DORECZENIU", "W_ODDZIALE"
        String locationName,   // Np. "Warszawa", "Sortownia Centralna"
        String description     // Np. "Paczka wydana kurierowi do doręczenia"
) {
}