package org.example.pocztabackend.controller;

import org.example.pocztabackend.dto.OpsCourierDispatchResponse;
import org.example.pocztabackend.dto.OpsDashboardSummaryResponse;
import org.example.pocztabackend.dto.OpsRecentEventResponse;
import org.example.pocztabackend.dto.OpsShipmentBoardItemResponse;
import org.example.pocztabackend.service.OperationalActorResolver;
import org.example.pocztabackend.service.OperationsConsoleQueryService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/ops")
public class OperationsConsoleController {

    private final OperationsConsoleQueryService operationsConsoleQueryService;
    private final OperationalActorResolver operationalActorResolver;

    public OperationsConsoleController(
            OperationsConsoleQueryService operationsConsoleQueryService,
            OperationalActorResolver operationalActorResolver
    ) {
        this.operationsConsoleQueryService = operationsConsoleQueryService;
        this.operationalActorResolver = operationalActorResolver;
    }

    @GetMapping("/dashboard-summary")
    public OpsDashboardSummaryResponse getDashboardSummary() {
        operationalActorResolver.requireAdminActor(true);
        return operationsConsoleQueryService.getDashboardSummary();
    }

    @GetMapping("/shipments-board")
    public List<OpsShipmentBoardItemResponse> getShipmentsBoard() {
        operationalActorResolver.requireAdminActor(true);
        return operationsConsoleQueryService.getShipmentBoard();
    }

    @GetMapping("/courier-dispatch")
    public OpsCourierDispatchResponse getCourierDispatch() {
        operationalActorResolver.requireAdminActor(true);
        return operationsConsoleQueryService.getCourierDispatch();
    }

    @GetMapping("/recent-events")
    public List<OpsRecentEventResponse> getRecentEvents() {
        operationalActorResolver.requireAdminActor(true);
        return operationsConsoleQueryService.getRecentEvents();
    }
}
