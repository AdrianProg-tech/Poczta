package org.example.pocztabackend.controller;

import java.util.List;
import org.example.pocztabackend.dto.AdminUserSummaryResponse;
import org.example.pocztabackend.service.OperationalActorResolver;
import org.example.pocztabackend.service.AdminUserQueryService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/users")
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
    public List<AdminUserSummaryResponse> getUsers() {
        operationalActorResolver.requireAdminActor(true);
        return adminUserQueryService.getAdminUsers();
    }
}
