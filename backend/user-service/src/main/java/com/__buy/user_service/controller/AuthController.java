package com.__buy.user_service.controller;

import jakarta.annotation.security.PermitAll;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.time.Duration;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.__buy.user_service.dto.AuthResponse;
import com.__buy.user_service.dto.AuthResult;
import com.__buy.user_service.dto.LoginRequest;
import com.__buy.user_service.dto.RegisterRequest;
import com.__buy.user_service.exception.UnauthorizedException;
import com.__buy.user_service.service.AuthService;

@RestController
@RequestMapping("/users/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PermitAll
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletResponse response) {

        AuthResult auth = authService.register(request);

        addRefreshCookie(response, auth.refreshToken());

        return new AuthResponse(
                auth.accessToken(),
                auth.user());
    }

    @PermitAll
    @PostMapping("/login")
    public AuthResponse login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {

        AuthResult auth = authService.login(request);

        addRefreshCookie(response, auth.refreshToken());

        return new AuthResponse(
                auth.accessToken(),
                auth.user());
    }

    @PostMapping("/refresh")
    public AuthResponse refreshToken(
            @CookieValue(required = false) String refreshToken,
            HttpServletResponse response) {

        if (refreshToken == null) {
            throw new UnauthorizedException("Missing refresh token");
        }
        AuthResult auth = authService.refreshToken(refreshToken);

        addRefreshCookie(response, auth.refreshToken());

        return new AuthResponse(
                auth.accessToken(),
                auth.user());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("refreshToken", "").httpOnly(true).secure(false)
                .sameSite("Lax").path("/api/users/auth/refresh").maxAge(0).build();

        response.addHeader("Set-Cookie", cookie.toString());

        return ResponseEntity.noContent().build();
    }

    private void addRefreshCookie(HttpServletResponse response, String refreshToken) {
        ResponseCookie cookie = ResponseCookie.from("refreshToken", refreshToken).httpOnly(true).secure(false)
                .sameSite("Lax").path("/api/users/auth/refresh").maxAge(Duration.ofDays(7)).build();

        response.addHeader("Set-Cookie", cookie.toString());
    }
}