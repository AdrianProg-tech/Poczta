package org.example.pocztabackend.controller;

import jakarta.validation.Valid;
import org.example.pocztabackend.dto.AdminAssignCourierRequest;
import org.example.pocztabackend.dto.AdminAssignCourierResponse;
import org.example.pocztabackend.dto.ShipmentStateChangeResponse;
import org.example.pocztabackend.service.DispatchOperationsService;
import org.example.pocztabackend.service.OperationalActorResolver;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/shipments")
public class AdminShipmentContractController {

    private final DispatchOperationsService dispatchOperationsService;
    private final OperationalActorResolver operationalActorResolver;

    public AdminShipmentContractController(
            DispatchOperationsService dispatchOperationsService,
            OperationalActorResolver operationalActorResolver
    ) {
        this.dispatchOperationsService = dispatchOperationsService;
        this.operationalActorResolver = operationalActorResolver;
    }

    @PostMapping("/{shipmentId}/prepare-for-dispatch")
    public ShipmentStateChangeResponse prepareForDispatch(@PathVariable UUID shipmentId) {
        operationalActorResolver.requireAdminActor(true);
        return dispatchOperationsService.prepareForDispatch(shipmentId);
    }

    @PostMapping("/{shipmentId}/assign-courier")
    public AdminAssignCourierResponse assignCourier(
            @PathVariable UUID shipmentId,
            @Valid @RequestBody AdminAssignCourierRequest request
    ) {
        operationalActorResolver.requireAdminActor(true);
        return dispatchOperationsService.assignCourier(shipmentId, request);
    }

    @PostMapping("/{shipmentId}/reassign-courier")
    public AdminAssignCourierResponse reassignCourier(
            @PathVariable UUID shipmentId,
            @Valid @RequestBody AdminAssignCourierRequest request
    ) {
        operationalActorResolver.requireAdminActor(true);
        return dispatchOperationsService.reassignCourier(shipmentId, request);
    }
}
