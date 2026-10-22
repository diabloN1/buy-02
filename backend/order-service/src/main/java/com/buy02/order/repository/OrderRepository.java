package com.buy02.order.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import com.buy02.order.entity.Order;

public interface OrderRepository extends MongoRepository<Order, String> {

        Optional<Order> findByIdAndDeletedFalse(String id);

        Page<Order> findByUserIdAndDeletedFalse(String userId, Pageable pageable);

        @Query(value = "{ 'userId': ?0, 'deleted': false }", fields = "{ '_id': 1 }")
        List<Order> findOrderIdsByUserId(String userId);
}