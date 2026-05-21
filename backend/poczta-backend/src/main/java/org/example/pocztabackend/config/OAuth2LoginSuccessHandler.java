package org.example.pocztabackend.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.example.pocztabackend.model.Role;
import org.example.pocztabackend.model.User;
import org.example.pocztabackend.repository.RoleRepository;
import org.example.pocztabackend.repository.UserRepository;
import org.example.pocztabackend.service.AuthSessionService;
import org.example.pocztabackend.service.RoleCatalog;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AuthSessionService authSessionService;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    public OAuth2LoginSuccessHandler(
            UserRepository userRepository,
            RoleRepository roleRepository,
            AuthSessionService authSessionService
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.authSessionService = authSessionService;
    }

    @Override
    @Transactional
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        String firstName = oAuth2User.getAttribute("given_name");
        String lastName = oAuth2User.getAttribute("family_name");

        if (email == null) {
            response.sendRedirect(frontendUrl + "/login?error=oauth2_no_email");
            return;
        }

        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseGet(() -> createOAuth2User(email, firstName, lastName));

        if (!user.isActive()) {
            response.sendRedirect(frontendUrl + "/login?error=account_inactive");
            return;
        }

        AuthSessionService.SessionLoginResult session = authSessionService.loginOAuth2(user);
        String redirectUrl = frontendUrl + "/oauth2-callback?token=" + session.accessToken();
        response.sendRedirect(redirectUrl);
    }

    private User createOAuth2User(String email, String firstName, String lastName) {
        Role clientRole = roleRepository.findByName(RoleCatalog.CLIENT)
                .orElseThrow(() -> new IllegalStateException("CLIENT role not found in database"));

        User user = new User();
        user.setEmail(email.toLowerCase());
        user.setFirstName(firstName != null ? firstName : email);
        user.setLastName(lastName != null ? lastName : "");
        user.setActive(true);
        user.setCreatedAt(LocalDateTime.now());
        Set<Role> roles = new HashSet<>();
        roles.add(clientRole);
        user.setRoles(roles);
        return userRepository.save(user);
    }
}
