package com.buy02.order.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.buy02.order.dto.CreateOrderRequest;
import com.buy02.order.dto.OrderResponse;
import com.buy02.order.dto.OrderSearchCriteria;

public interface OrderService {

    OrderResponse createOrder(String userId, CreateOrderRequest request);

    OrderResponse getOrder(String orderId, String userId);

    Page<OrderResponse> getOrdersByUser(String userId, Pageable pageable);

    void cancelOrder(String orderId, String userId);

    void redoOrder(String orderId, String userId);

    void deleteOrder(String orderId, String userId);

    Page<OrderResponse> searchOrders(String userId, OrderSearchCriteria criteria, Pageable pageable);
}