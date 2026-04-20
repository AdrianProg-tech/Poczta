package org.example.pocztabackend.dto;

import java.util.UUID;

public record ComplaintRequest(
        UUID shipmentId, // ID paczki, której dotyczy reklamacja
        UUID userId,     // ID użytkownika zgłaszającego
        String type,     // Typ reklamacji (np. "USZKODZENIE", "ZAGUBIENIE")
        String description // Opis problemu
) {
}