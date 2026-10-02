package com.buy02.order.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.buy02.order.entity.SubOrder;

public interface SubOrderRepository extends MongoRepository<SubOrder, String> {
    List<SubOrder> findByOrderId(String orderId);

    List<SubOrder> findByOrderIdIn(List<String> orderIds);
}