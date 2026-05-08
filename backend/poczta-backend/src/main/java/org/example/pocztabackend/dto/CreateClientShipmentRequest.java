package org.example.pocztabackend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record CreateClientShipmentRequest(
        @NotNull(message = "sender is required")
        @Valid
        CreateShipmentSenderRequest sender,
        @NotNull(message = "recipient is required")
        @Valid
        CreateShipmentRecipientRequest recipient,
        @NotNull(message = "delivery is required")
        @Valid
        CreateShipmentDeliveryRequest delivery,
        @NotNull(message = "parcel is required")
        @Valid
        CreateShipmentParcelRequest parcel,
        @NotNull(message = "payment is required")
        @Valid
        CreateShipmentPaymentSelectionRequest payment
) {
}
