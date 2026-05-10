package org.example.pocztabackend.controller;

import jakarta.validation.Valid;
import org.example.pocztabackend.dto.AuthLoginRequest;
import org.example.pocztabackend.dto.AuthLoginResponse;
import org.example.pocztabackend.dto.CurrentUserResponse;
import org.example.pocztabackend.service.AuthFacadeService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthFacadeService authFacadeService;

    public AuthController(AuthFacadeService authFacadeService) {
        this.authFacadeService = authFacadeService;
    }

    @PostMapping("/login")
    public AuthLoginResponse login(@Valid @RequestBody AuthLoginRequest request) {
        return authFacadeService.login(request.email(), request.password());
    }

    @PostMapping("/logout")
    public void logout(
            @RequestHeader(name = "Authorization", required = false) String authorizationHeader
    ) {
        authFacadeService.logout(authorizationHeader);
    }

    @GetMapping("/me")
    public CurrentUserResponse getCurrentUser() {
        return authFacadeService.getCurrentUser();
    }
}
