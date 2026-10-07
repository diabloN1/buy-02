package com.buy01.product.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import com.buy01.product.entity.Category;

public interface CategoryRepository extends MongoRepository<Category, String> {
    boolean existsByName(String name);
}