package org.example.pocztabackend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record UserRequest(
        @NotBlank(message = "firstName is required")
        String firstName,
        @NotBlank(message = "lastName is required")
        String lastName,
        @NotBlank(message = "email is required")
        @Email(message = "email must be valid")
        String email,
        @NotBlank(message = "phone is required")
        String phone,
        String persona,
        String serviceCity,
        String pointCode
) {
}
