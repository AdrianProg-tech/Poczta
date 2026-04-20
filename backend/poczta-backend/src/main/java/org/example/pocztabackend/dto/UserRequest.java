package org.example.pocztabackend.dto;

public record UserRequest(
        String firstName,
        String lastName,
        String email,
        String phone
) {
}