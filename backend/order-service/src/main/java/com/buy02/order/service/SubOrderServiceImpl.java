package com.buy02.order.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.buy02.order.aop.Auditable;
import com.buy02.order.dto.OrderResponse;
import com.buy02.order.dto.OrderSearchCriteria;
import com.buy02.order.entity.Order;
import com.buy02.order.entity.Order.OrderStatus;
import com.buy02.order.entity.SubOrder;
import com.buy02.order.event.audit.AuditAction;
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
        private final MongoTemplate mongoTemplate;

        private static final Map<OrderStatus, Set<OrderStatus>> SELLER_TRANSITIONS = Map.of(
                        OrderStatus.PENDING, Set.of(OrderStatus.CONFIRMED, OrderStatus.CANCELLED),
                        OrderStatus.CONFIRMED, Set.of(OrderStatus.SHIPPED),
                        OrderStatus.SHIPPED, Set.of(OrderStatus.DELIVERED),
                        OrderStatus.DELIVERED, Set.of(),
                        OrderStatus.CANCELLED, Set.of());

        @Override
        @Auditable(action = AuditAction.SELECTED, entityId = "#subOrderId")
        public OrderResponse getSubOrder(String subOrderId, String sellerId) {

                SubOrder subOrder = resolveSubOrder(subOrderId);
                verifySellerOwnership(subOrder, sellerId);

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

                SubOrder subOrder = resolveSubOrder(subOrderId);
                verifySellerOwnership(subOrder, sellerId);

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
        @Auditable(action = AuditAction.SELECTED)
        public Page<OrderResponse> searchOrdersBySeller(String sellerId, OrderSearchCriteria criteria,
                        Pageable pageable) {
                Query query = new Query();
                query.addCriteria(Criteria.where("sellerId").is(sellerId));
                query.addCriteria(Criteria.where("deleted").is(false));

                if (criteria.getStatus() != null) {
                        query.addCriteria(Criteria.where("status").is(criteria.getStatus()));
                }

                if (criteria.getStartDate() != null) {
                        query.addCriteria(Criteria.where("createdAt").gte(criteria.getStartDate()));
                }

                if (criteria.getProductName() != null && !criteria.getProductName().trim().isEmpty()) {
                        String sanitized = Pattern.quote(criteria.getProductName().trim());
                        query.addCriteria(Criteria.where("items.productName").regex(sanitized, "i"));
                }

                long total = mongoTemplate.count(query, SubOrder.class);
                query.with(pageable);
                List<SubOrder> subOrders = mongoTemplate.find(query, SubOrder.class);

                if (subOrders.isEmpty()) {
                        return new PageImpl<>(Collections.emptyList(), pageable, total);
                }

                List<String> orderIds = subOrders.stream()
                                .map(SubOrder::getOrderId)
                                .filter(Objects::nonNull)
                                .distinct()
                                .toList();

                List<Object> orderIdLookups = new ArrayList<>();
                for (String id : orderIds) {
                        orderIdLookups.add(id);
                        if (org.bson.types.ObjectId.isValid(id)) {
                                orderIdLookups.add(new org.bson.types.ObjectId(id));
                        }
                }

                Query parentOrdersQuery = new Query(Criteria.where("_id").in(orderIdLookups));
                List<Order> orders = mongoTemplate.find(parentOrdersQuery, Order.class);

                Map<String, Order> ordersById = orders.stream()
                                .collect(Collectors.toMap(Order::getId, o -> o, (existing, replacement) -> existing));

                List<OrderResponse> responses = subOrders.stream().map(subOrder -> {
                        Order order = ordersById.get(subOrder.getOrderId());
                        OrderResponse response = orderMapper.toResponse(order);
                        response.setSubOrders(orderMapper.toSubOrderResponses(List.of(subOrder)));
                        return response;
                }).toList();

                return new PageImpl<>(responses, pageable, total);
        }

        @Override
        @Auditable(action = AuditAction.DELETED, entityId = "#orderId")
        public void deleteSubOrder(String subOrderId, String userId) {

                SubOrder subOrder = resolveSubOrder(subOrderId);
                verifySellerOwnership(subOrder, userId);

                OrderStatus currentStatus = subOrder.getStatus();
                if (!currentStatus.equals(OrderStatus.CANCELLED) &&
                                !currentStatus.equals(OrderStatus.DELIVERED)) {
                        throw new BadRequestException(
                                        "Can't delete order if still in progress!");
                }

                subOrder.setDeleted(true);
                subOrderRepository.save(subOrder);
        }

        private SubOrder resolveSubOrder(String subOrderId) {
                return subOrderRepository.findByIdAndDeletedFalse(subOrderId)
                                .orElseThrow(() -> new NotFoundException(
                                                "SubOrder not found with id: " + subOrderId));
        }

        private void verifySellerOwnership(SubOrder subOrder, String sellerId) {
                if (!subOrder.getSellerId().equals(sellerId)) {
                        throw new ForbiddenException(
                                        "You don't have permission to access this suborder");
                }
        }
}
