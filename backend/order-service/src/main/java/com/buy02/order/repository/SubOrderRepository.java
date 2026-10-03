package com.buy02.order.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import com.buy02.order.entity.SubOrder;

public interface SubOrderRepository extends MongoRepository<SubOrder, String> {

    @Override
    @Query("{ '_id': ?0, 'deleted': false }")
    java.util.Optional<SubOrder> findById(String id);

    @Query("{ 'orderId': ?0, 'deleted': false }")
    List<SubOrder> findByOrderId(String orderId);

    @Query("{ 'orderId': { $in: ?0 }, 'deleted': false }")
    List<SubOrder> findByOrderIdIn(List<String> orderIds);

}