package com.buy01.product.controller;

import com.buy01.product.BaseIntegrationTest;
import com.buy01.product.entity.Category;
import com.buy01.product.repository.CategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CategoryControllerIT extends BaseIntegrationTest {

    @Autowired
    private CategoryRepository categoryRepository;

    @BeforeEach
    void setupTestData() {
        categoryRepository.deleteAll();

        categoryRepository.save(Category.builder()
                .name("Books")
                .description("All kinds of books")
                .build());
    }

    @Nested
    @DisplayName("Public Category Endpoints")
    class PublicCategoryEndpoints {

        @Test
        @DisplayName("GET /categories - Should return all categories without authentication")
        void shouldReturnAllCategories() throws Exception {
            mockMvc.perform(get("/categories"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$[0].name").value("Books"));
        }
    }
}
