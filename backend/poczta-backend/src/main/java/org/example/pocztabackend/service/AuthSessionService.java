package org.example.pocztabackend.service;

import org.example.pocztabackend.model.User;
import org.example.pocztabackend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthSessionService {

    private static final String DEMO_PASSWORD = "demo1234";
    private static final String BEARER_PREFIX = "Bearer ";

    private final UserRepository userRepository;
    private final Map<String, SessionRecord> sessions = new ConcurrentHashMap<>();

    public AuthSessionService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public SessionLoginResult login(String email, String password) {
        if (password == null || !DEMO_PASSWORD.equals(password)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        User user = userRepository.findByEmail(normalizeEmail(email))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        if (!user.isActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User account is inactive");
        }

        String token = UUID.randomUUID().toString();
        LocalDateTime now = LocalDateTime.now();
        sessions.put(token, new SessionRecord(user.getId(), user.getEmail(), now, now));
        return new SessionLoginResult(token, user);
    }

    public void logout(String authorizationHeader) {
        String token = extractBearerToken(authorizationHeader);
        if (token == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing bearer token");
        }
        sessions.remove(token);
    }

    public User resolveAuthenticatedUser(String authorizationHeader) {
        String token = extractBearerToken(authorizationHeader);
        if (token != null) {
            SessionRecord session = sessions.get(token);
            if (session == null) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Session token is invalid or expired");
            }

            sessions.put(token, session.withLastUsedAt(LocalDateTime.now()));
            return userRepository.findById(session.userId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User for session not found"));
        }

        throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Missing or invalid bearer token"
        );
    }

    private String extractBearerToken(String authorizationHeader) {
        if (authorizationHeader == null || authorizationHeader.isBlank()) {
            return null;
        }
        String trimmed = authorizationHeader.trim();
        if (!trimmed.regionMatches(true, 0, BEARER_PREFIX, 0, BEARER_PREFIX.length())) {
            return null;
        }

        String token = trimmed.substring(BEARER_PREFIX.length()).trim();
        return token.isBlank() ? null : token;
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    public record SessionLoginResult(String accessToken, User user) {
    }

    private record SessionRecord(
            UUID userId,
            String email,
            LocalDateTime createdAt,
            LocalDateTime lastUsedAt
    ) {
        private SessionRecord withLastUsedAt(LocalDateTime newLastUsedAt) {
            return new SessionRecord(userId, email, createdAt, newLastUsedAt);
        }
    }
}
