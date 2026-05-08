package org.example.pocztabackend.controller;

import jakarta.validation.Valid;
import org.example.pocztabackend.dto.AdminAssignCourierRequest;
import org.example.pocztabackend.dto.AdminAssignCourierResponse;
import org.example.pocztabackend.dto.ShipmentStateChangeResponse;
import org.example.pocztabackend.service.AdminShipmentOperationsService;
import org.example.pocztabackend.service.CourierTaskContractService;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/shipments")
public class AdminShipmentContractController {

    private final CourierTaskContractService courierTaskContractService;
    private final AdminShipmentOperationsService adminShipmentOperationsService;

    public AdminShipmentContractController(
            CourierTaskContractService courierTaskContractService,
            AdminShipmentOperationsService adminShipmentOperationsService
    ) {
        this.courierTaskContractService = courierTaskContractService;
        this.adminShipmentOperationsService = adminShipmentOperationsService;
    }

    @PostMapping("/{shipmentId}/prepare-for-dispatch")
    public ShipmentStateChangeResponse prepareForDispatch(@PathVariable UUID shipmentId) {
        return adminShipmentOperationsService.prepareForDispatch(shipmentId);
    }

    @PostMapping("/{shipmentId}/assign-courier")
    public AdminAssignCourierResponse assignCourier(
            @PathVariable UUID shipmentId,
            @Valid @RequestBody AdminAssignCourierRequest request
    ) {
        return courierTaskContractService.assignCourier(shipmentId, request);
    }
}
