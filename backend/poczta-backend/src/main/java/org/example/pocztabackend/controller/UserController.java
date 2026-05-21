package org.example.pocztabackend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.example.pocztabackend.dto.UserRequest;
import org.example.pocztabackend.dto.UserResponse;
import org.example.pocztabackend.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@Tag(name = "Użytkownicy", description = "Zarządzanie użytkownikami systemu")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    @Operation(summary = "Pobierz listę wszystkich użytkowników")
    public List<UserResponse> getAllUsers() {
        return userService.getAllUsers().stream()
                .map(UserResponse::fromEntity)
                .toList();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Pobierz użytkownika po ID")
    public UserResponse getUserById(@PathVariable UUID id) {
        return UserResponse.fromEntity(userService.getUserById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Utwórz nowego użytkownika")
    public UserResponse createUser(@Valid @RequestBody UserRequest request) {
        return UserResponse.fromEntity(userService.createUser(request));
    }
}
