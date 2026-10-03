package com.buy02.order.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import com.buy02.order.entity.Order;

public interface OrderRepository extends MongoRepository<Order, String> {

        @Override
        @Query("{ '_id': ?0, 'deleted': false }")
        Optional<Order> findById(String id);

        @Query("{ 'userId': ?0, 'deleted': false }")
        Page<Order> findByUserId(String userId, Pageable pageable);
}