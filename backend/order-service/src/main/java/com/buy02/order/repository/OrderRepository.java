package com.buy02.order.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.buy02.order.entity.Order;

public interface OrderRepository extends MongoRepository<Order, String> {
        Page<Order> findByUserId(String userId, Pageable pageable);
}