package org.example.pocztabackend.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record IssueNoticeResponse(
        UUID noticeId,
        String noticeNumber,
        LocalDateTime issuedAt,
        LocalDateTime expiresAt,
        String pickupPointCode,
        String trackingNumber
) {
}
