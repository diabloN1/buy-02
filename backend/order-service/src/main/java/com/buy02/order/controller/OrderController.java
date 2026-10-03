package com.buy02.order.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.buy02.order.dto.CreateOrderRequest;
import com.buy02.order.dto.OrderResponse;
import com.buy02.order.service.OrderService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.security.oauth2.jwt.Jwt;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PreAuthorize("isAuthenticated()")
    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(
            @RequestBody @Valid CreateOrderRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();

        return ResponseEntity.ok(orderService.createOrder(userId, request));
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponse> getOrder(
            @PathVariable String orderId,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();

        OrderResponse response = orderService.getOrder(orderId, userId);

        return ResponseEntity.ok(response);
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping
    public ResponseEntity<Page<OrderResponse>> getOrdersByUser(
            @AuthenticationPrincipal Jwt jwt,
            Pageable pageable) {

        String userId = jwt.getSubject();

        Page<OrderResponse> orders = orderService.getOrdersByUser(userId, pageable);

        return ResponseEntity.ok(orders);
    }

    @PreAuthorize("isAuthenticated()")
    @PatchMapping("/{orderId}/cancel")
    public ResponseEntity<Void> cancelOrder(
            @PathVariable String orderId,
            @AuthenticationPrincipal Jwt jwt) {

        String userId = jwt.getSubject();

        orderService.cancelOrder(orderId, userId);

        return ResponseEntity.noContent().build();
    }
}