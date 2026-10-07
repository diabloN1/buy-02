package com.__buy.user_service.controller;

import com.__buy.user_service.BaseIntegrationTest;
import com.__buy.user_service.client.MediaClient;
import com.__buy.user_service.dto.MediaResponse;
import com.__buy.user_service.dto.UpdateUserRequest;
import com.__buy.user_service.entity.Role;
import com.__buy.user_service.entity.User;
import com.__buy.user_service.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.springframework.security.core.authority.SimpleGrantedAuthority;

class UserControllerIT extends BaseIntegrationTest {

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @MockitoBean
    private MediaClient mediaClient;

    private User regularUser;
    private User adminUser;

    @BeforeEach
    void setupTestData() {
        userRepository.deleteAll();

        regularUser = userRepository.save(User.builder()
                .name("Regular User")
                .email("user@example.com")
                .password("encoded_pass")
                .role(Role.USER)
                .build());

        adminUser = userRepository.save(User.builder()
                .name("Admin User")
                .email("admin@example.com")
                .password("encoded_pass")
                .role(Role.ADMIN)
                .build());
    }

    // public endpoints
    @Nested
    @DisplayName("GET /users/widget/{id}")
    class WidgetTests {

        @Test
        @DisplayName("Should return user widget without authentication")
        void shouldReturnWidgetAnonymously() throws Exception {
            mockMvc.perform(get("/users/widget/{id}", regularUser.getId()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(regularUser.getId()))
                    .andExpect(jsonPath("$.name").value("Regular User"));
        }
    }

    // current User (/users/me) endpoints
    @Nested
    @DisplayName("Current User Endpoints (/users/me)")
    class CurrentUserTests {

        @Test
        @DisplayName("GET /users/me - Should return profile of authenticated user")
        void shouldReturnCurrentUser() throws Exception {
            mockMvc.perform(get("/users/me")
                    .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))
                            .jwt(j -> j.subject(regularUser.getId()))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(regularUser.getId()))
                    .andExpect(jsonPath("$.email").value("user@example.com"));
        }

        @Test
        @DisplayName("GET /users/me - Should return 401 when unauthenticated")
        void shouldFailWhenUnauthenticated() throws Exception {
            mockMvc.perform(get("/users/me"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("PUT /users/me - Should update profile of authenticated user")
        void shouldUpdateCurrentUser() throws Exception {
            UpdateUserRequest request = new UpdateUserRequest();
            request.setName("Updated Name");
            request.setEmail("updated@example.com");

            mockMvc.perform(put("/users/me")
                    .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))
                            .jwt(j -> j.subject(regularUser.getId())))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.name").value("Updated Name"))
                    .andExpect(jsonPath("$.email").value("updated@example.com"));

            var updatedInDb = userRepository.findById(regularUser.getId());
            assertThat(updatedInDb).isPresent();
            assertThat(updatedInDb.get().getName()).isEqualTo("Updated Name");
        }

        @Test
        @DisplayName("PUT /users/me - Should return 400 when request is invalid")
        void shouldFailWhenUpdateDataInvalid() throws Exception {
            UpdateUserRequest invalidRequest = new UpdateUserRequest();
            invalidRequest.setName("");
            invalidRequest.setEmail("invalid-email");

            mockMvc.perform(put("/users/me")
                    .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))
                            .jwt(j -> j.subject(regularUser.getId())))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(invalidRequest)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("Avatar Endpoints (/users/me/avatar)")
    class AvatarTests {

        @Test
        @DisplayName("POST /users/me/avatar - Should upload avatar via Feign client")
        void shouldUploadAvatarSuccessfully() throws Exception {
            MockMultipartFile file = new MockMultipartFile(
                    "image",
                    "avatar.png",
                    MediaType.IMAGE_PNG_VALUE,
                    "dummy-image-bytes".getBytes());

            MediaResponse fakeMediaResponse = MediaResponse.builder().id("media-123")
                    .path("http://media-service/images/media-123.png").build();

            when(mediaClient.upload(any(), any())).thenReturn(fakeMediaResponse);

            mockMvc.perform(multipart("/users/me/avatar")
                    .file(file)
                    .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))
                            .jwt(j -> j.subject(regularUser.getId()))))
                    .andExpect(status().isOk());

            verify(mediaClient, times(1)).upload(any(), any());
        }

    }

    // admin only endpoints
    @Nested
    @DisplayName("Admin Endpoints")
    class AdminEndpointTests {

        @Test
        @DisplayName("GET /users - Should allow ADMIN to fetch paginated users")
        void shouldAllowAdminToGetAllUsers() throws Exception {
            mockMvc.perform(get("/users")
                    .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))
                            .jwt(j -> j.subject(adminUser.getId()))))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").isArray())
                    .andExpect(jsonPath("$.totalElements").value(2));
        }

        @Test
        @DisplayName("GET /users - Should return 403 FORBIDDEN when accessed by non-admin")
        void shouldDenyNonAdminFromGetAllUsers() throws Exception {
            mockMvc.perform(get("/users")
                    .with(jwt().jwt(j -> j.subject(regularUser.getId()).claim("role", "USER"))))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.code").value("FORBIDDEN"));
        }

        @Test
        @DisplayName("GET /users/{id} - Should return user when requested by ADMIN")
        void shouldAllowAdminToGetUserById() throws Exception {
            mockMvc.perform(get("/users/{id}", regularUser.getId())
                    .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))
                            .jwt(j -> j.subject(adminUser.getId()))))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(regularUser.getId()));
        }

        @Test
        @DisplayName("PUT /users/{id} - Should allow ADMIN to update user")
        void shouldAllowAdminToUpdateUser() throws Exception {
            UpdateUserRequest request = new UpdateUserRequest();
            request.setName("Admin Changed Name");
            request.setEmail("adminchanged@example.com");

            mockMvc.perform(put("/users/{id}", regularUser.getId())
                    .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))
                            .jwt(j -> j.subject(adminUser.getId())))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.name").value("Admin Changed Name"));
        }

        @Test
        @DisplayName("DELETE /users/{id} - Should allow ADMIN to delete user")
        void shouldAllowAdminToDeleteUser() throws Exception {
            mockMvc.perform(delete("/users/{id}", regularUser.getId())
                    .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))
                            .jwt(j -> j.subject(adminUser.getId()))))
                    .andDo(print())
                    .andExpect(status().isNoContent());

            assertThat(userRepository.findById(regularUser.getId())).isEmpty();
        }

        @Test
        @DisplayName("GET /users/count - Should allow ADMIN to retrieve total user count")
        void shouldAllowAdminToCountUsers() throws Exception {
            mockMvc.perform(get("/users/count")
                    .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))
                            .jwt(j -> j.subject(adminUser.getId()))))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(content().string("2"));
        }
    }
}