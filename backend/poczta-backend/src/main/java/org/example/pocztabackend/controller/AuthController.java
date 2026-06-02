package org.example.pocztabackend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import jakarta.validation.Valid;
import org.example.pocztabackend.dto.AuthLoginRequest;
import org.example.pocztabackend.dto.AuthLoginResponse;
import org.example.pocztabackend.dto.CurrentUserResponse;
import org.example.pocztabackend.dto.DemoUserOptionResponse;
import org.example.pocztabackend.service.AuthFacadeService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Autentykacja", description = "Logowanie, wylogowanie i pobieranie danych zalogowanego użytkownika")
public class AuthController {

    private final AuthFacadeService authFacadeService;

    public AuthController(AuthFacadeService authFacadeService) {
        this.authFacadeService = authFacadeService;
    }

    @PostMapping("/login")
    @Operation(summary = "Zaloguj się i uzyskaj token Bearer")
    public AuthLoginResponse login(@Valid @RequestBody AuthLoginRequest request) {
        return authFacadeService.login(request.email(), request.password());
    }

    @PostMapping("/logout")
    @Operation(summary = "Wyloguj się (unieważnij token)")
    public void logout(
            @RequestHeader(name = "Authorization", required = false) String authorizationHeader
    ) {
        authFacadeService.logout(authorizationHeader);
    }

    @GetMapping("/me")
    @Operation(summary = "Pobierz dane aktualnie zalogowanego użytkownika")
    public CurrentUserResponse getCurrentUser() {
        return authFacadeService.getCurrentUser();
    }
    @GetMapping("/demo-users")
    @Operation(summary = "Pobierz aktywne konta demo dla wybranej grupy roli")
    public List<DemoUserOptionResponse> getDemoUsers(@RequestParam("group") String group) {
        return authFacadeService.getDemoUsers(group);
    }
}
