package org.example.pocztabackend.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ComplaintAttachmentResponse(
        UUID attachmentId,
        String fileName,
        LocalDateTime uploadedAt
) {}
