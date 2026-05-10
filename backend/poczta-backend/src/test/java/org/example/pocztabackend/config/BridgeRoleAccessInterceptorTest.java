package org.example.pocztabackend.config;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import org.example.pocztabackend.service.OperationalActorResolver;
import org.example.pocztabackend.service.RoleCatalog;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class BridgeRoleAccessInterceptorTest {

    @Mock
    private OperationalActorResolver operationalActorResolver;

    private BridgeRoleAccessInterceptor interceptor;

    @BeforeEach
    void setUp() {
        interceptor = new BridgeRoleAccessInterceptor(operationalActorResolver);
    }

    @Test
    void shouldRequireClientRoleForClientRoutes() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/client/shipments");

        interceptor.preHandle(request, new MockHttpServletResponse(), new Object());

        verify(operationalActorResolver).requireRoleActor(null, RoleCatalog.CLIENT, "client");
    }

    @Test
    void shouldAllowOptionsWithoutRoleChecks() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("OPTIONS", "/api/admin/payments");

        interceptor.preHandle(request, new MockHttpServletResponse(), new Object());

        verifyNoInteractions(operationalActorResolver);
    }

    @Test
    void shouldDelegateOpsRoutesToAdminResolver() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/ops/dashboard-summary");

        when(operationalActorResolver.requireAdminActor(true))
                .thenThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "blocked"));

        assertThrows(
                ResponseStatusException.class,
                () -> interceptor.preHandle(request, new MockHttpServletResponse(), new Object())
        );

        verify(operationalActorResolver).requireAdminActor(true);
    }
}
