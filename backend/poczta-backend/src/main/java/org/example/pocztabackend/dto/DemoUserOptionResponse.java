package org.example.pocztabackend.dto;

public record DemoUserOptionResponse(
        String email,
        String displayName,
        String appRole,
        String adminScope,
        String pointCode,
        String pointName,
        String serviceCity
) {
}
