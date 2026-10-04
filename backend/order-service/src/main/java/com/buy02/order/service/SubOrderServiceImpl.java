package com.buy02.order.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.buy02.order.aop.Auditable;
import com.buy02.order.dto.OrderResponse;
import com.buy02.order.entity.Order;
import com.buy02.order.entity.Order.OrderStatus;
import com.buy02.order.entity.SubOrder;
import com.buy02.order.event.AuditAction;
import com.buy02.order.exception.custom.BadRequestException;
import com.buy02.order.exception.custom.ForbiddenException;
import com.buy02.order.exception.custom.NotFoundException;
import com.buy02.order.mapper.OrderMapper;
import com.buy02.order.repository.OrderRepository;
import com.buy02.order.repository.SubOrderRepository;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubOrderServiceImpl implements SubOrderService {

    private final OrderRepository orderRepository;
    private final SubOrderRepository subOrderRepository;
    private final OrderMapper orderMapper;

    private static final Map<OrderStatus, Set<OrderStatus>> SELLER_TRANSITIONS = Map.of(
            OrderStatus.PENDING, Set.of(OrderStatus.CONFIRMED, OrderStatus.CANCELLED),
            OrderStatus.CONFIRMED, Set.of(OrderStatus.SHIPPED),
            OrderStatus.SHIPPED, Set.of(OrderStatus.DELIVERED),
            OrderStatus.DELIVERED, Set.of(),
            OrderStatus.CANCELLED, Set.of());

    @Override
    @Auditable(action = AuditAction.SELECTED, entityId = "#subOrderId")
    public OrderResponse getSubOrder(String subOrderId, String sellerId) {

        SubOrder subOrder = subOrderRepository.findByIdAndDeletedFalse(subOrderId)
                .orElseThrow(() -> new NotFoundException(
                        "SubOrder not found with id: " + subOrderId));

        if (!subOrder.getSellerId().equals(sellerId)) {
            throw new ForbiddenException(
                    "You don't have permission to view this suborder");
        }

        Order order = orderRepository.findById(subOrder.getOrderId())
                .orElseThrow(() -> new NotFoundException(
                        "Order not found with id: " + subOrder.getOrderId()));

        OrderResponse response = orderMapper.toResponse(order);
        response.setSubOrders(orderMapper.toSubOrderResponses(List.of(subOrder)));

        return response;
    }

    @Override
    @Auditable(action = AuditAction.SELECTED)
    public Page<OrderResponse> getOrdersBySellerId(String sellerId, Pageable pageable) {

        Page<SubOrder> subOrderPage = subOrderRepository.findBySellerIdAndDeletedFalse(
                sellerId, pageable);

        List<String> orderIds = subOrderPage.getContent().stream()
                .map(SubOrder::getOrderId)
                .distinct()
                .toList();

        List<Order> orders = new ArrayList<>();
        orderRepository.findAllById(orderIds).forEach(orders::add);
        Map<String, Order> ordersById = orders.stream()
                .collect(Collectors.toMap(Order::getId, o -> o));

        return subOrderPage.map(subOrder -> {
            Order order = ordersById.get(subOrder.getOrderId());
            OrderResponse response = orderMapper.toResponse(order);
            response.setSubOrders(orderMapper.toSubOrderResponses(List.of(subOrder)));
            return response;
        });
    }

    @Override
    @Auditable(action = AuditAction.MODIFIED, entityId = "#subOrderId")
    public void updateStatus(String subOrderId, String sellerId, OrderStatus nextStatus) {

        SubOrder subOrder = subOrderRepository.findByIdAndDeletedFalse(subOrderId)
                .orElseThrow(() -> new NotFoundException(
                        "SubOrder not found with id: " + subOrderId));

        if (!subOrder.getSellerId().equals(sellerId)) {
            throw new ForbiddenException(
                    "You don't have permission to update this suborder");
        }

        OrderStatus currentStatus = subOrder.getStatus();
        Set<OrderStatus> allowedTransitions = SELLER_TRANSITIONS.get(currentStatus);

        if (allowedTransitions == null || allowedTransitions.isEmpty()) {
            throw new BadRequestException(
                    "Cannot update status from " + currentStatus
                     + ". No further transitions are allowed.");
        }

        if (!allowedTransitions.contains(nextStatus)) {
            throw new BadRequestException(
                    "Cannot update status from "
                     + currentStatus + " to " + nextStatus + ".");

        }

        subOrder.setStatus(nextStatus);
        subOrder.getStatusHistory().add(SubOrder.StatusHistory.builder()
                .status(nextStatus)
                .timestamp(LocalDateTime.now())
                .changedBy(sellerId)
                .build());

        subOrderRepository.save(subOrder);
    }

    @Override
    @Auditable(action = AuditAction.DELETED, entityId = "#orderId")
    public void deleteSubOrder(String orderId, String userId) {

        SubOrder subOrder = subOrderRepository.findByIdAndDeletedFalse(orderId)
                .orElseThrow(() -> new NotFoundException(
                        "SubOrder not found with id: " + orderId));

        if (!subOrder.getSellerId().equals(userId)) {
            throw new ForbiddenException(
                    "You don't have permission to delete this suborder");
        }

        subOrder.setDeleted(true);
        subOrderRepository.save(subOrder);
    }
}
