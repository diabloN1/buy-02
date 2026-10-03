package com.buy02.order.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.buy02.order.dto.OrderResponse;

public interface SubOrderService {

    OrderResponse getSubOrder(String subOrderId, String sellerId);

    Page<OrderResponse> getOrdersBySellerId(String sellerId, Pageable pageable);

    void updateStatus(String subOrderId, String sellerId);

    void deleteSubOrder(String orderId, String userId);
}
