package org.example.pocztabackend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record AuthLoginRequest(
        @NotBlank(message = "email is required")
        @Email(message = "email must be valid")
        String email,
        @NotBlank(message = "password is required")
        String password
) {
}
