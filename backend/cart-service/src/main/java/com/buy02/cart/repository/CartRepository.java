package com.buy02.cart.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.buy02.cart.entity.Cart;

public interface CartRepository extends MongoRepository<Cart, String> {
}
