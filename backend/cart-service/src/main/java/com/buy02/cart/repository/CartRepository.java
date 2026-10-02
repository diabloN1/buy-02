package com.buy02.cart.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.buy02.cart.entity.Cart;

public interface CartRepository extends MongoRepository<Cart, String> {
    Optional<Cart> findByUserId(String userId);
}
