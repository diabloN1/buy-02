package com.buy01.product.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.buy01.product.entity.Product;

public interface ProductRepository extends MongoRepository<Product, String>, ProductCustomRepository {
    Page<Product> findByUserId(String userId, Pageable pageable);

    Page<Product> findByCategoryId(String categoryId, Pageable pageable);
}
