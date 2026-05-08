package org.example.pocztabackend.controller;

import org.example.pocztabackend.dto.CurrentUserResponse;
import org.example.pocztabackend.service.AuthFacadeService;
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

    @GetMapping("/me")
    public CurrentUserResponse getCurrentUser(
            @RequestHeader(name = "X-User-Email", required = false) String userEmail
    ) {
        return authFacadeService.getCurrentUser(userEmail);
    }
}
