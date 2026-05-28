package org.example.pocztabackend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.example.pocztabackend.dto.AvailableShipmentResponse;
import org.example.pocztabackend.dto.CourierTaskStateChangeResponse;
import org.example.pocztabackend.service.CourierTaskContractService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/courier/shipments")
@Tag(name = "Przesyłki kuriera", description = "Dostępne przesyłki do podjęcia przez kuriera")
public class CourierShipmentContractController {

    private final CourierTaskContractService courierTaskContractService;

    public CourierShipmentContractController(CourierTaskContractService courierTaskContractService) {
        this.courierTaskContractService = courierTaskContractService;
    }

    @GetMapping("/available")
    @Operation(summary = "Pobierz przesyłki dostępne do podjęcia przez kuriera")
    public List<AvailableShipmentResponse> getAvailableShipments() {
        return courierTaskContractService.getAvailableShipments(null);
    }

    @PostMapping("/{shipmentId}/claim")
    @Operation(summary = "Podjmij przesyłkę — utwórz zadanie kuriera")
    public CourierTaskStateChangeResponse claimShipment(@PathVariable UUID shipmentId) {
        return courierTaskContractService.claimShipment(null, shipmentId);
    }
}
