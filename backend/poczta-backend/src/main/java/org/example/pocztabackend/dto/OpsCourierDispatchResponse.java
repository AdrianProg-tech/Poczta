package org.example.pocztabackend.dto;

import java.util.List;

public record OpsCourierDispatchResponse(
        List<OpsCourierSummaryResponse> couriers,
        List<OpsDispatchCandidateResponse> shipmentsAwaitingAssignment
) {
}
