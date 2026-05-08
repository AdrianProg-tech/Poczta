package org.example.pocztabackend.controller;

import org.example.pocztabackend.dto.OpsCourierDispatchResponse;
import org.example.pocztabackend.dto.OpsDashboardSummaryResponse;
import org.example.pocztabackend.dto.OpsRecentEventResponse;
import org.example.pocztabackend.dto.OpsShipmentBoardItemResponse;
import org.example.pocztabackend.service.OperationsConsoleQueryService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/ops")
public class OperationsConsoleController {

    private final OperationsConsoleQueryService operationsConsoleQueryService;

    public OperationsConsoleController(OperationsConsoleQueryService operationsConsoleQueryService) {
        this.operationsConsoleQueryService = operationsConsoleQueryService;
    }

    @GetMapping("/dashboard-summary")
    public OpsDashboardSummaryResponse getDashboardSummary() {
        return operationsConsoleQueryService.getDashboardSummary();
    }

    @GetMapping("/shipments-board")
    public List<OpsShipmentBoardItemResponse> getShipmentsBoard() {
        return operationsConsoleQueryService.getShipmentBoard();
    }

    @GetMapping("/courier-dispatch")
    public OpsCourierDispatchResponse getCourierDispatch() {
        return operationsConsoleQueryService.getCourierDispatch();
    }

    @GetMapping("/recent-events")
    public List<OpsRecentEventResponse> getRecentEvents() {
        return operationsConsoleQueryService.getRecentEvents();
    }
}
