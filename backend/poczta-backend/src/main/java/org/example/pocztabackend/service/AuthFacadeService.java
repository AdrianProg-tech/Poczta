package org.example.pocztabackend.service;

import org.example.pocztabackend.dto.CurrentUserResponse;
import org.example.pocztabackend.model.User;
import org.example.pocztabackend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthFacadeService {

    private final UserRepository userRepository;

    public AuthFacadeService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public CurrentUserResponse getCurrentUser(String userEmailHeader) {
        User user = requireUser(userEmailHeader);
        return CurrentUserResponse.fromEntity(user);
    }

    public User requireUser(String userEmailHeader) {
        if (userEmailHeader == null || userEmailHeader.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentication is not configured yet. Provide X-User-Email as a temporary bridge."
            );
        }

        return userRepository.findByEmail(userEmailHeader.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }
}
