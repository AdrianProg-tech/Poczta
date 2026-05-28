package org.example.pocztabackend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.UUID;
import org.example.pocztabackend.dto.AdminUserDetailResponse;
import org.example.pocztabackend.dto.AdminUserSummaryResponse;
import org.example.pocztabackend.dto.AdminUserUpdateRequest;
import org.example.pocztabackend.dto.UserToggleActiveResponse;
import org.example.pocztabackend.service.AdminUserQueryService;
import org.example.pocztabackend.service.OperationalActorResolver;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/users")
@Tag(name = "Użytkownicy (admin)", description = "Przeglądanie użytkowników przez administratora")
public class AdminUserContractController {

    private final AdminUserQueryService adminUserQueryService;
    private final OperationalActorResolver operationalActorResolver;

    public AdminUserContractController(
            AdminUserQueryService adminUserQueryService,
            OperationalActorResolver operationalActorResolver
    ) {
        this.adminUserQueryService = adminUserQueryService;
        this.operationalActorResolver = operationalActorResolver;
    }

    @GetMapping
    @Operation(summary = "Pobierz listę wszystkich użytkowników")
    public List<AdminUserSummaryResponse> getUsers() {
        operationalActorResolver.requireAdminActor(true);
        return adminUserQueryService.getAdminUsers();
    }

    @GetMapping("/{userId}")
    @Operation(summary = "Pobierz szczegóły użytkownika do edycji")
    public AdminUserDetailResponse getUserDetail(@PathVariable UUID userId) {
        operationalActorResolver.requireAdminActor(true);
        return adminUserQueryService.getUserDetail(userId);
    }

    @PatchMapping("/{userId}")
    @Operation(summary = "Zaktualizuj dane użytkownika")
    public AdminUserDetailResponse updateUser(@PathVariable UUID userId, @RequestBody AdminUserUpdateRequest request) {
        operationalActorResolver.requireAdminActor(true);
        return adminUserQueryService.updateUser(userId, request);
    }

    @PostMapping("/{userId}/toggle-active")
    @Operation(summary = "Przełącz stan aktywności użytkownika")
    public UserToggleActiveResponse toggleActive(@PathVariable UUID userId) {
        operationalActorResolver.requireAdminActor(true);
        return adminUserQueryService.toggleActive(userId);
    }
}
