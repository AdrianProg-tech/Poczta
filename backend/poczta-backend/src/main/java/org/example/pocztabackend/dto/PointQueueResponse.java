package org.example.pocztabackend.dto;

import java.util.List;

public record PointQueueResponse(
        List<PointQueueItemResponse> acceptQueue,
        List<PointQueueItemResponse> pickupQueue,
        List<PointQueueItemResponse> offlinePaymentQueue
) {
}
