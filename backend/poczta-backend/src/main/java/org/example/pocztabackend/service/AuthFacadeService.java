package org.example.pocztabackend.service;

import java.util.List;
import org.example.pocztabackend.dto.AuthLoginResponse;
import org.example.pocztabackend.dto.CurrentUserResponse;
import org.example.pocztabackend.dto.DemoUserOptionResponse;
import org.example.pocztabackend.model.CourierProfile;
import org.example.pocztabackend.model.PointStaffAssignment;
import org.example.pocztabackend.model.User;
import org.springframework.stereotype.Service;

@Service
public class AuthFacadeService {

    private final OperationalActorResolver operationalActorResolver;
    private final AuthSessionService authSessionService;
    private final AuthDemoUserService authDemoUserService;

    public AuthFacadeService(
            OperationalActorResolver operationalActorResolver,
            AuthSessionService authSessionService,
            AuthDemoUserService authDemoUserService
    ) {
        this.operationalActorResolver = operationalActorResolver;
        this.authSessionService = authSessionService;
        this.authDemoUserService = authDemoUserService;
    }

    public AuthLoginResponse login(String email, String password) {
        AuthSessionService.SessionLoginResult loginResult = authSessionService.login(email, password);
        return new AuthLoginResponse(loginResult.accessToken(), toCurrentUserResponse(loginResult.user()));
    }

    public void logout(String authorizationHeader) {
        authSessionService.logout(authorizationHeader);
    }

    public CurrentUserResponse getCurrentUser() {
        User user = requireUser();
        return toCurrentUserResponse(user);
    }

    public CurrentUserResponse getCurrentUser(String ignoredUserEmailHeader) {
        return getCurrentUser();
    }

    public List<DemoUserOptionResponse> getDemoUsers(String group) {
        return authDemoUserService.listDemoUsers(group);
    }

    private CurrentUserResponse toCurrentUserResponse(User user) {
        CourierProfile courierProfile = operationalActorResolver.getCourierProfile(user);
        PointStaffAssignment pointAssignment = operationalActorResolver.getPrimaryPointAssignment(user);
        return CurrentUserResponse.fromEntity(user, courierProfile, pointAssignment);
    }

    public User requireUser() {
        return operationalActorResolver.requireAuthenticatedUser();
    }

    public User requireUser(String ignoredUserEmailHeader) {
        return requireUser();
    }
}
