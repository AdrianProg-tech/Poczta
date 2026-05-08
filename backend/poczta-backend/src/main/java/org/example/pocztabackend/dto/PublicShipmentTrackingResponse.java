package org.example.pocztabackend.dto;

//Zrobiłem to w ten sposób, żeby nie wypluwać na zewnątrz całego ShipmentTrackingResponse (bo klient nie potrzebuje UUID ze środka bazy), tylko ładnie sformatowane zdarzenie

import org.example.pocztabackend.model.enums.ShipmentStatus;
import java.time.LocalDate;
import java.util.List;

public record PublicShipmentTrackingResponse(
        String trackingNumber,
        ShipmentStatus currentStatus,
        String deliveryType,
        String destinationSummary,
        LocalDate estimatedDeliveryDate,
        List<PublicTrackingEventResponse> history
) {}
