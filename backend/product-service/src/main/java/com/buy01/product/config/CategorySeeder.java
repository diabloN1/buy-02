package com.buy01.product.config;

import com.buy01.product.entity.Category;
import com.buy01.product.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class CategorySeeder implements CommandLineRunner {

    private final CategoryRepository categoryRepository;

    @Override
    public void run(String... args) {
        if (categoryRepository.count() == 0) {
            log.info("Seeding categories into the database...");

            List<Category> predefinedCategories = List.of(
                    Category.builder().name("Electronics").description("Gadgets, phones, and computers").build(),
                    Category.builder().name("Fashion").description("Clothing, shoes, and accessories").build(),
                    Category.builder().name("Home & Kitchen").description("Furniture and appliances").build(),
                    Category.builder().name("Sports").description("Sporting goods and outdoors").build(),
                    Category.builder().name("Toys").description("Kids toys and games").build());

            categoryRepository.saveAll(predefinedCategories);
            log.info("Categories seeded successfully.");
        }
    }
}