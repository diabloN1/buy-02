package com.buy02.cart.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.buy02.cart.entity.Cart;

public interface CartRepository extends MongoRepository<Cart, String> {
    Page<Cart> findByUserId(String userId, Pageable pageable);
}
