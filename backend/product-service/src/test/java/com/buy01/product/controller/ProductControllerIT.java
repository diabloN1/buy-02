package com.buy01.product.controller;

import com.buy01.product.BaseIntegrationTest;
import com.buy01.product.DTOs.CreateRequest;
import com.buy01.product.entity.Category;
import com.buy01.product.entity.Product;
import com.buy01.product.repository.CategoryRepository;
import com.buy01.product.repository.ProductRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockPart;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;

import java.math.BigDecimal;
import java.util.ArrayList;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ProductControllerIT extends BaseIntegrationTest {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private Category category;
    private Product sampleProduct;

    @BeforeEach
    void setupTestData() {
        productRepository.deleteAll();
        categoryRepository.deleteAll();

        category = categoryRepository.save(Category.builder()
                .name("Electronics")
                .description("Tech items")
                .build());

        sampleProduct = productRepository.save(Product.builder()
                .name("Wireless Mouse")
                .description("Ergonomic mouse")
                .price(new BigDecimal("29.99"))
                .quantity(50)
                .imageIds(new ArrayList<>())
                .categoryId(category.getId())
                .categoryName(category.getName())
                .userId("seller-1")
                .build());
    }

    @Nested
    @DisplayName("Public Product Endpoints")
    class PublicProductEndpoints {

        @Test
        @DisplayName("GET /products - Should return paginated products without authentication")
        void shouldReturnProductsAnonymously() throws Exception {
            mockMvc.perform(get("/products"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").isArray())
                    .andExpect(jsonPath("$.totalElements").value(1));
        }

        @Test
        @DisplayName("GET /products/{id} - Should return product details by ID")
        void shouldReturnProductById() throws Exception {
            mockMvc.perform(get("/products/{id}", sampleProduct.getId()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(sampleProduct.getId()))
                    .andExpect(jsonPath("$.name").value("Wireless Mouse"))
                    .andExpect(jsonPath("$.price").value(29.99));
        }

        @Test
        @DisplayName("GET /products/{id} - Should return 404 NOT_FOUND for invalid ID")
        void shouldReturn404ForInvalidId() throws Exception {
            mockMvc.perform(get("/products/{id}", "non-existent-id"))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("Seller Product Endpoints")
    class SellerProductEndpoints {

        @Test
        @DisplayName("POST /products - Should create product when authenticated as SELLER")
        void shouldCreateProductAsSeller() throws Exception {
            CreateRequest createReq = new CreateRequest(
                    "Gaming Headset",
                    "Immersive 7.1 sound headset",
                    new BigDecimal("89.99"),
                    20,
                    category.getId());

            MockPart productPart = new MockPart("product", objectMapper.writeValueAsBytes(createReq));
            productPart.getHeaders().setContentType(MediaType.APPLICATION_JSON);

            mockMvc.perform(multipart("/products")
                    .part(productPart)
                    .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_SELLER"))
                            .jwt(j -> j.subject("seller-1"))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.name").value("Gaming Headset"))
                    .andExpect(jsonPath("$.price").value(89.99));

            assertThat(productRepository.findAll()).hasSize(2);
        }

        @Test
        @DisplayName("POST /products - Should return 403 FORBIDDEN when user has role USER")
        void shouldFailCreateProductAsUser() throws Exception {
            CreateRequest createReq = new CreateRequest(
                    "Gaming Headset",
                    "Immersive sound headset",
                    new BigDecimal("89.99"),
                    20,
                    category.getId());

            MockPart productPart = new MockPart("product", objectMapper.writeValueAsBytes(createReq));
            productPart.getHeaders().setContentType(MediaType.APPLICATION_JSON);

            mockMvc.perform(multipart("/products")
                    .part(productPart)
                    .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))
                            .jwt(j -> j.subject("user-1"))))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("POST /products - Should return 401 UNAUTHORIZED when unauthenticated")
        void shouldFailCreateProductUnauthenticated() throws Exception {
            CreateRequest createReq = new CreateRequest(
                    "Gaming Headset",
                    "Immersive sound headset",
                    new BigDecimal("89.99"),
                    20,
                    category.getId());

            MockPart productPart = new MockPart("product", objectMapper.writeValueAsBytes(createReq));
            productPart.getHeaders().setContentType(MediaType.APPLICATION_JSON);

            mockMvc.perform(multipart("/products")
                    .part(productPart))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("Admin Product Endpoints")
    class AdminProductEndpoints {

        @Test
        @DisplayName("DELETE /products/{id} - Should allow ADMIN to delete product")
        void shouldDeleteProductAsAdmin() throws Exception {
            mockMvc.perform(delete("/products/{id}", sampleProduct.getId())
                    .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))
                            .jwt(j -> j.subject("admin-1"))))
                    .andExpect(status().isNoContent());

            assertThat(productRepository.findById(sampleProduct.getId())).isEmpty();
        }

        @Test
        @DisplayName("DELETE /products/{id} - Should return 403 FORBIDDEN for non-admin user")
        void shouldDenyDeleteProductForNonAdmin() throws Exception {
            mockMvc.perform(delete("/products/{id}", sampleProduct.getId())
                    .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))
                            .jwt(j -> j.subject("user-1"))))
                    .andExpect(status().isForbidden());
        }
    }
}
