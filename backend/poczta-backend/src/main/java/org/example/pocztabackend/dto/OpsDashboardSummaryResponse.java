package org.example.pocztabackend.dto;

public record OpsDashboardSummaryResponse(
        long totalShipments,
        long pendingPaymentShipments,
        long paymentFailedShipments,
        long readyForDispatchShipments,
        long awaitingCourierAssignmentShipments,
        long redirectedToPickupShipments,
        long awaitingPickupShipments,
        long activeCourierTasks,
        long complaintsInReview
) {
}
