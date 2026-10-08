package com.__buy.user_service.controller;

import com.__buy.user_service.BaseIntegrationTest;
import com.__buy.user_service.dto.LoginRequest;
import com.__buy.user_service.dto.RegisterRequest;
import com.__buy.user_service.dto.RegisterRole;
import com.__buy.user_service.repository.RefreshTokenRepository;
import com.__buy.user_service.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AuthControllerIT extends BaseIntegrationTest {

        @Autowired
        private ObjectMapper objectMapper;

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private RefreshTokenRepository refreshTokenRepo;

        @BeforeEach
        void cleanDatabase() {
                userRepository.deleteAll();
                refreshTokenRepo.deleteAll();
        }

        @Test
        @DisplayName("POST /users/auth/register - Should register user, save to MongoDB, and return tokens")
        void shouldRegisterSuccessfully() throws Exception {
                RegisterRole testRole = RegisterRole.values()[0];
                RegisterRequest request = new RegisterRequest(
                                "Test User",
                                "test@example.com",
                                "Password123",
                                testRole);

                mockMvc.perform(post("/users/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andDo(print())
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                                .andExpect(jsonPath("$.user.email").value("test@example.com"))
                                .andExpect(cookie().exists("refreshToken"));

                var userInDb = userRepository.findByEmail("test@example.com");
                assertThat(userInDb).isPresent();
                assertThat(userInDb.get().getName()).isEqualTo("Test User");
        }

        @Test
        @DisplayName("POST /users/auth/login - Should authenticate and return new tokens")
        void shouldLoginSuccessfully() throws Exception {
                RegisterRole testRole = RegisterRole.values()[0];
                RegisterRequest registerReq = new RegisterRequest(
                                "Test User",
                                "test@example.com",
                                "Password123",
                                testRole);

                mockMvc.perform(post("/users/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(registerReq)))
                                .andExpect(status().isCreated());

                LoginRequest loginReq = new LoginRequest("test@example.com", "Password123");

                mockMvc.perform(post("/users/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(loginReq)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                                .andExpect(cookie().exists("refreshToken"));
        }

        @Test
        @DisplayName("POST /users/auth/refresh - Should refresh token using valid refreshToken cookie")
        void shouldRefreshTokenSuccessfully() throws Exception {
                RegisterRole testRole = RegisterRole.values()[0];
                RegisterRequest registerReq = new RegisterRequest(
                                "Refresh User",
                                "refresh@example.com",
                                "Password123",
                                testRole);

                var registerResult = mockMvc.perform(post("/users/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(registerReq)))
                                .andExpect(status().isCreated())
                                .andReturn();

                Cookie refreshCookie = registerResult.getResponse().getCookie("refreshToken");
                assertThat(refreshCookie).isNotNull();

                mockMvc.perform(post("/users/auth/refresh")
                                .cookie(refreshCookie))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                                .andExpect(cookie().exists("refreshToken"));
        }

        @Test
        @DisplayName("POST /users/auth/refresh - Should return 401 when refreshToken cookie is missing")
        void shouldFailRefreshWithoutCookie() throws Exception {
                mockMvc.perform(post("/users/auth/refresh"))
                                .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("POST /users/auth/logout - Should clear refreshToken cookie")
        void shouldLogoutSuccessfully() throws Exception {
                mockMvc.perform(post("/users/auth/logout"))
                                .andExpect(status().isNoContent())
                                .andExpect(cookie().maxAge("refreshToken", 0));
        }
}