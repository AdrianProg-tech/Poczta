package org.example.pocztabackend.dto;

import java.util.List;

public record AdminUserUpdateRequest(
        String firstName,
        String lastName,
        String phone,
        List<String> roles,
        String serviceCity,
        String pointCode
) {}
