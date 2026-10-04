package com.buy02.order.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.buy02.order.entity.SubOrder;

public interface SubOrderRepository extends MongoRepository<SubOrder, String> {
    List<SubOrder> findByOrderId(String orderId);

    List<SubOrder> findByOrderIdIn(List<String> orderIds);

    java.util.Optional<SubOrder> findByIdAndDeletedFalse(String id);

    List<SubOrder> findByOrderIdInAndDeletedFalse(List<String> orderIds);

    Page<SubOrder> findBySellerIdAndDeletedFalse(String sellerId, Pageable pageable);
}