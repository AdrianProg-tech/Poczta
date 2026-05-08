package org.example.pocztabackend.dto;

import java.util.List;

public record ClientShipmentDetailsResponse(
        String trackingNumber,
        String currentStatus,
        ShipmentContactResponse sender,
        ShipmentContactResponse recipient,
        ShipmentParcelResponse parcel,
        ShipmentPaymentDetailsResponse payment,
        ShipmentDeliveryDetailsResponse delivery,
        List<TrackingHistoryItemResponse> history,
        List<String> allowedActions
) {
}
