package org.example.pocztabackend.dto;

public record AuthLoginResponse(
        String accessToken,
        CurrentUserResponse currentUser
) {
}
