package com.library.controller;

import com.library.dto.ChangePasswordRequest;
import com.library.dto.LoginRequest;
import com.library.dto.LoginResponse;
import com.library.dto.UserResponse;
import com.library.model.User;
import com.library.repository.UserRepository;
import com.library.security.JwtService;
import com.library.security.LoginAttemptService;
import com.library.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final UserService userService;
    private final LoginAttemptService loginAttempts;

    // Sign in: returns a JWT token
    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        loginAttempts.checkNotLocked(request.username());

        Authentication auth;
        try {
            auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.username(), request.password()));
        } catch (BadCredentialsException e) {
            loginAttempts.recordFailure(request.username());
            throw e;
        }
        loginAttempts.reset(request.username());

        UserDetails details = (UserDetails) auth.getPrincipal();
        User user = userRepository.findByUsername(details.getUsername()).orElseThrow();
        String token = jwtService.generateToken(details);
        return new LoginResponse(token, user.getUsername(), user.getFullName(), user.getRole().name());
    }

    // Current logged-in user
    @GetMapping("/me")
    public UserResponse me(Authentication authentication) {
        User u = userRepository.findByUsername(authentication.getName()).orElseThrow();
        return userService.toResponse(u);
    }

    // Change my own password
    @PutMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@Valid @RequestBody ChangePasswordRequest request, Authentication authentication) {
        userService.changeOwnPassword(authentication.getName(), request.oldPassword(), request.newPassword());
    }
}
