package org.example.pocztabackend.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.example.pocztabackend.service.OperationalActorResolver;
import org.example.pocztabackend.service.RoleCatalog;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class BridgeRoleAccessInterceptor implements HandlerInterceptor {

    private final OperationalActorResolver operationalActorResolver;

    public BridgeRoleAccessInterceptor(OperationalActorResolver operationalActorResolver) {
        this.operationalActorResolver = operationalActorResolver;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String path = request.getRequestURI();

        if ("/api/auth/login".equals(path)) {
            return true;
        }

        if ("/api/auth/logout".equals(path)) {
            operationalActorResolver.requireAuthenticatedUser();
            return true;
        }

        if ("/api/auth/me".equals(path)) {
            operationalActorResolver.requireAuthenticatedUser();
            return true;
        }

        if (path.startsWith("/api/client/")) {
            operationalActorResolver.requireRoleActor(null, RoleCatalog.CLIENT, "client");
            return true;
        }

        if (path.startsWith("/api/courier/")) {
            operationalActorResolver.requireCourierActor();
            return true;
        }

        if (path.startsWith("/api/point/")) {
            operationalActorResolver.requirePointActorPoint();
            return true;
        }

        if (path.startsWith("/api/ops/") || path.startsWith("/api/admin/shipments/")) {
            operationalActorResolver.requireAdminActor(true);
            return true;
        }

        if (path.startsWith("/api/admin/")) {
            operationalActorResolver.requireAdminActor(false);
        }

        return true;
    }
}
