package com.buy02.order.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import com.buy02.order.dto.OrderResponse;
import com.buy02.order.entity.Order.OrderStatus;
import com.buy02.order.service.SubOrderService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/suborders")
public class SubOrderController {

    private final SubOrderService subOrderService;

    @GetMapping("/{subOrderId}")
    public OrderResponse getSubOrder(@PathVariable String subOrderId,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();

        return subOrderService.getSubOrder(subOrderId, userId);
    }

    @GetMapping
    public Page<OrderResponse> getOrdersBySellerId(@AuthenticationPrincipal Jwt jwt,
            Pageable pageable) {
        String userId = jwt.getSubject();

        return subOrderService.getOrdersBySellerId(userId, pageable);
    }

    @PatchMapping("/{subOrderId}/status")
    public ResponseEntity<Void> updateStatus(@PathVariable String subOrderId,
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam OrderStatus status) {
        String userId = jwt.getSubject();

        subOrderService.updateStatus(subOrderId, userId, status);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{orderId}")
    public ResponseEntity<Void> deleteSubOrder(@PathVariable String orderId,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();

        subOrderService.deleteSubOrder(orderId, userId);
        return ResponseEntity.ok().build();
    }
}