package com.buy02.order.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.bson.types.ObjectId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.buy02.order.aop.AuditEventProducer;
import com.buy02.order.aop.Auditable;
import com.buy02.order.client.CartClient;
import com.buy02.order.client.ProductClient;
import com.buy02.order.dto.CartResponse;
import com.buy02.order.dto.CreateOrderRequest;
import com.buy02.order.dto.OrderResponse;
import com.buy02.order.dto.OrderSearchCriteria;
import com.buy02.order.dto.ProductResponse;
import com.buy02.order.entity.Order;
import com.buy02.order.entity.Order.OrderStatus;
import com.buy02.order.entity.SubOrder.Item;
import com.buy02.order.entity.SubOrder;
import com.buy02.order.event.audit.AuditAction;
import com.buy02.order.event.sales.CancelAuditEvent;
import com.buy02.order.event.sales.SaleAuditEvent;
import com.buy02.order.exception.custom.BadRequestException;
import com.buy02.order.exception.custom.ForbiddenException;
import com.buy02.order.exception.custom.NotFoundException;
import com.buy02.order.mapper.OrderMapper;
import com.buy02.order.repository.OrderRepository;
import com.buy02.order.repository.SubOrderRepository;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderServiceImpl implements OrderService {

        private final OrderRepository orderRepository;
        private final SubOrderRepository subOrderRepository;
        private final CartClient cartClient;
        private final ProductClient productClient;
        private final OrderMapper orderMapper;
        private final AuditEventProducer eventProducer;
        private final MongoTemplate mongoTemplate;

        private static final List<OrderStatus> STATUS_FLOW = List.of(
                        OrderStatus.PENDING,
                        OrderStatus.CONFIRMED,
                        OrderStatus.SHIPPED,
                        OrderStatus.DELIVERED,
                        OrderStatus.CANCELLED);

        @Override
        @Auditable(action = AuditAction.CREATED, entityId = "#result.id")
        public OrderResponse createOrder(String userId, CreateOrderRequest request) {

                CartResponse cart = cartClient.getCart();

                if (cart.getItems() == null || cart.getItems().isEmpty()) {
                        throw new BadRequestException(
                                        "Cart is empty. Cannot create an order without items.");
                }

                BigDecimal calculatedTotal = cart.getItems()
                                .stream()
                                .map(item -> item.getPrice()
                                                .multiply(BigDecimal.valueOf(item.getQuantity())))
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                if (calculatedTotal.compareTo(request.totalAmount()) != 0) {
                        throw new BadRequestException(
                                        "Order total mismatch. Expected: "
                                                        + calculatedTotal
                                                        + ", received: "
                                                        + request.totalAmount());
                }

                Order.ShippingAddress shippingAddress = orderMapper.toShippingAddress(
                                request.shippingAddress());

                Order order = Order.builder()
                                .userId(userId)
                                .totalAmount(calculatedTotal)
                                .shippingAddress(shippingAddress)
                                .paymentMethod(Order.PaymentMethod.PAY_ON_DELIVERY)
                                .build();

                Order savedOrder = orderRepository.save(order);

                List<SubOrder> subOrders = createSubOrdersBySeller(
                                savedOrder.getId(),
                                cart.getItems());

                List<SubOrder> savedSubOrders = subOrderRepository.saveAll(subOrders);

                produceSaleEvent(savedSubOrders, userId);

                OrderResponse response = orderMapper.toResponse(savedOrder);

                response.setSubOrders(orderMapper.toSubOrderResponses(savedSubOrders));

                return response;
        }

        @Override
        @Auditable(action = AuditAction.SELECTED, entityId = "#orderId")
        public OrderResponse getOrder(String orderId, String userId) {

                Order order = orderRepository.findByIdAndDeletedFalse(orderId)
                                .orElseThrow(() -> new NotFoundException(
                                                "Order not found with id: " + orderId));

                if (!order.getUserId().equals(userId)) {
                        throw new ForbiddenException(
                                        "You don't have permission to view this order");
                }

                List<SubOrder> subOrders = subOrderRepository.findByOrderId(orderId);

                OrderResponse response = orderMapper.toResponse(order);

                response.setSubOrders(orderMapper.toSubOrderResponses(subOrders));

                return response;
        }

        @Override
        public Page<OrderResponse> getOrdersByUser(String userId, Pageable pageable) {

                Page<Order> orders = orderRepository.findByUserIdAndDeletedFalse(userId, pageable);

                List<String> orderIds = orders.getContent()
                                .stream()
                                .map(Order::getId)
                                .toList();

                if (orderIds.isEmpty()) {
                        return orders.map(orderMapper::toResponse);
                }

                List<SubOrder> subOrders = subOrderRepository.findByOrderIdIn(
                                orderIds);

                Map<String, List<SubOrder>> subOrdersByOrder = subOrders.stream()
                                .collect(Collectors.groupingBy(SubOrder::getOrderId));

                return orders.map(order -> {

                        OrderResponse response = orderMapper.toResponse(order);

                        response.setSubOrders(
                                        orderMapper.toSubOrderResponses(
                                                        subOrdersByOrder.getOrDefault(
                                                                        order.getId(),
                                                                        List.of())));

                        return response;
                });
        }

        public void cancelOrder(String orderId, String userId) {

                Order order = orderRepository.findByIdAndDeletedFalse(orderId)
                                .orElseThrow(() -> new NotFoundException(
                                                "Order not found with id: " + orderId));

                if (!order.getUserId().equals(userId)) {
                        throw new ForbiddenException(
                                        "You don't have permission to view this order");
                }

                var subOrders = subOrderRepository.findByOrderId(orderId);

                if (!resolveOrderStatus(subOrders).equals(OrderStatus.PENDING)) {
                        throw new BadRequestException(
                                        "Can't cancel order if passed PENDING!");
                }

                List<SubOrder> canceledSubOrders = subOrders
                                .stream()
                                .map((subOrder) -> {
                                        subOrder.setStatus(OrderStatus.CANCELLED);
                                        subOrder.getStatusHistory().add(
                                                        SubOrder.StatusHistory.builder()
                                                                        .status(OrderStatus.CANCELLED)
                                                                        .timestamp(LocalDateTime.now())
                                                                        .changedBy(userId)
                                                                        .build());
                                        return subOrder;
                                })
                                .toList();

                subOrderRepository.saveAll(canceledSubOrders);

                produceCancelationEvent(canceledSubOrders);
        };

        @Override
        @Auditable(action = AuditAction.CREATED)
        public void redoOrder(String orderId, String userId) {

                Order originalOrder = orderRepository.findByIdAndDeletedFalse(orderId)
                                .orElseThrow(() -> new NotFoundException(
                                                "Order not found with id: " + orderId));

                if (!originalOrder.getUserId().equals(userId)) {
                        throw new ForbiddenException(
                                        "You don't have permission to redo this order");
                }

                List<SubOrder> originalSubOrders = subOrderRepository.findByOrderId(orderId);

                validateStockAvailability(originalSubOrders);

                Order newOrder = orderMapper.copyOrder(originalOrder);
                Order savedOrder = orderRepository.save(newOrder);

                List<SubOrder> newSubOrders = originalSubOrders.stream()
                                .map(orderMapper::copySubOrder)
                                .peek(sub -> sub.setOrderId(savedOrder.getId()))
                                .toList();
                subOrderRepository.saveAll(newSubOrders);

                produceSaleEvent(newSubOrders, userId);
        }

        @Override
        @Auditable(action = AuditAction.DELETED, entityId = "#orderId")
        public void deleteOrder(String orderId, String userId) {

                Order order = orderRepository.findByIdAndDeletedFalse(orderId)
                                .orElseThrow(() -> new NotFoundException(
                                                "Order not found with id: " + orderId));

                if (!order.getUserId().equals(userId)) {
                        throw new ForbiddenException(
                                        "You don't have permission to delete this order");
                }

                List<SubOrder> subOrders = subOrderRepository.findByOrderId(orderId);

                if (!resolveOrderStatus(subOrders).equals(OrderStatus.CANCELLED) &&
                                !resolveOrderStatus(subOrders).equals(OrderStatus.DELIVERED)) {
                        throw new BadRequestException(
                                        "Can't delete order if still in progress!");
                }

                order.setDeleted(true);

                orderRepository.save(order);
        }

        private void validateStockAvailability(List<SubOrder> subOrders) {

                List<String> productIds = subOrders.stream()
                                .flatMap(sub -> sub.getItems().stream())
                                .map(SubOrder.Item::getProductId)
                                .distinct()
                                .toList();

                Map<String, ProductResponse> productsById = productClient
                                .getProductsByIds(productIds)
                                .stream()
                                .collect(Collectors.toMap(ProductResponse::getId, p -> p));

                for (SubOrder subOrder : subOrders) {
                        for (SubOrder.Item item : subOrder.getItems()) {

                                ProductResponse product = productsById.get(item.getProductId());

                                if (product == null) {
                                        throw new BadRequestException(
                                                        "Product no longer available: " + item.getProductName());
                                }

                                if (product.getQuantity() < item.getQuantity()) {
                                        throw new BadRequestException(
                                                        "Insufficient stock for product: "
                                                                        + product.getName()
                                                                        + ". Available: " + product.getQuantity()
                                                                        + ", requested: " + item.getQuantity());
                                }
                        }
                }
        }

        private List<SubOrder> createSubOrdersBySeller(
                        String orderId,
                        List<CartResponse.CartItemResponse> cartItems) {

                Map<String, List<CartResponse.CartItemResponse>> itemsBySeller = cartItems.stream()
                                .collect(Collectors.groupingBy(
                                                CartResponse.CartItemResponse::getOwnerId));

                List<SubOrder> subOrders = new ArrayList<>();

                for (Map.Entry<String, List<CartResponse.CartItemResponse>> entry : itemsBySeller.entrySet()) {

                        String sellerId = entry.getKey();

                        List<CartResponse.CartItemResponse> sellerItems = entry.getValue();

                        List<SubOrder.Item> orderItems = orderMapper.toOrderItems(sellerItems);

                        BigDecimal sellerTotal = sellerItems.stream()
                                        .map(item -> item.getPrice()
                                                        .multiply(BigDecimal.valueOf(item.getQuantity())))
                                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                        SubOrder subOrder = SubOrder.builder()
                                        .orderId(orderId)
                                        .sellerId(sellerId)
                                        .items(orderItems)
                                        .totalAmount(sellerTotal)
                                        .build();

                        subOrders.add(subOrder);
                }

                return subOrders;
        }

        private void produceSaleEvent(List<SubOrder> suborders, String buyerId) {
                suborders.stream()
                                .forEach((sub) -> sub.getItems()
                                                .forEach((item) -> {
                                                        eventProducer.send(SaleAuditEvent.builder()
                                                                        .buyerId(buyerId)
                                                                        .sellerId(sub.getSellerId())
                                                                        .subOrderId(sub.getId())
                                                                        .productId(item.getProductId())
                                                                        .productName(item.getProductName())
                                                                        .category("CATEGORIE")
                                                                        .itemPrice(item.getPrice())
                                                                        .quantity(item.getQuantity())
                                                                        .timestamp(Instant.now())
                                                                        .build());

                                                }));
        }

        private void produceCancelationEvent(List<SubOrder> subOrders) {
                subOrders.stream()
                                .forEach((sub) -> {
                                        Map<String, Integer> productByQuantity = sub.getItems()
                                                        .stream()
                                                        .collect(Collectors.toMap(
                                                                        Item::getProductId,
                                                                        Item::getQuantity));

                                        eventProducer.send(CancelAuditEvent.builder()
                                                        .subOrderId(sub.getId())
                                                        .productByQuantity(productByQuantity)
                                                        .build());
                                });

        }

        private OrderStatus resolveOrderStatus(List<SubOrder> subOrders) {
                for (OrderStatus status : STATUS_FLOW) {
                        boolean anyMatch = subOrders.stream()
                                        .anyMatch(sub -> sub.getStatus() == status);
                        if (anyMatch) {
                                return status;
                        }
                }
                return OrderStatus.PENDING;
        }

        @Override
        public Page<OrderResponse> searchOrders(String userId, OrderSearchCriteria criteria, Pageable pageable) {
                boolean hasProductFilter = criteria.getProductName() != null
                                && !criteria.getProductName().trim().isEmpty();
                boolean hasStatusFilter = criteria.getStatus() != null;

                Query orderQuery = new Query();
                orderQuery.addCriteria(Criteria.where("userId").is(userId));
                orderQuery.addCriteria(Criteria.where("deleted").is(false));

                if (criteria.getStartDate() != null) {
                        orderQuery.addCriteria(Criteria.where("createdAt").gte(criteria.getStartDate()));
                }

                if (hasProductFilter || hasStatusFilter) {

                        Page<Order> userOrders = orderRepository.findByUserIdAndDeletedFalse(userId,
                                        Pageable.unpaged());
                        List<String> userOrderIds = userOrders.getContent().stream()
                                        .map(Order::getId)
                                        .filter(Objects::nonNull)
                                        .toList();

                        if (userOrderIds.isEmpty()) {
                                return Page.empty(pageable);
                        }

                        List<Object> orderIdLookups = new ArrayList<>();
                        for (String id : userOrderIds) {
                                orderIdLookups.add(id);
                                if (ObjectId.isValid(id)) {
                                        orderIdLookups.add(new ObjectId(id));
                                }
                        }

                        Query subOrderQuery = new Query();
                        subOrderQuery.addCriteria(Criteria.where("orderId").in(orderIdLookups));
                        subOrderQuery.addCriteria(Criteria.where("deleted").is(false));

                        if (hasStatusFilter) {
                                subOrderQuery.addCriteria(Criteria.where("status").is(criteria.getStatus()));
                        }

                        if (hasProductFilter) {
                                String sanitized = Pattern.quote(criteria.getProductName().trim());
                                subOrderQuery.addCriteria(Criteria.where("items.productName").regex(sanitized, "i"));
                        }

                        List<SubOrder> matchingSubOrders = mongoTemplate.find(subOrderQuery, SubOrder.class);

                        List<String> matchedOrderIds = matchingSubOrders.stream()
                                        .map(SubOrder::getOrderId)
                                        .filter(Objects::nonNull)
                                        .distinct()
                                        .toList();

                        if (matchedOrderIds.isEmpty()) {
                                return Page.empty(pageable);
                        }

                        List<Object> targetIdLookups = new ArrayList<>();
                        for (String id : matchedOrderIds) {
                                targetIdLookups.add(id);
                                if (ObjectId.isValid(id)) {
                                        targetIdLookups.add(new ObjectId(id));
                                }
                        }

                        orderQuery.addCriteria(Criteria.where("_id").in(targetIdLookups));
                }

                long total = mongoTemplate.count(orderQuery, Order.class);
                orderQuery.with(pageable);
                List<Order> orders = mongoTemplate.find(orderQuery, Order.class);

                if (orders.isEmpty()) {
                        return new PageImpl<>(Collections.emptyList(), pageable, total);
                }

                List<String> orderIds = orders.stream().map(Order::getId).toList();
                List<SubOrder> subOrders = subOrderRepository.findByOrderIdIn(orderIds);
                Map<String, List<SubOrder>> subOrdersByOrder = subOrders.stream()
                                .filter(sub -> sub.getOrderId() != null)
                                .collect(Collectors.groupingBy(SubOrder::getOrderId));

                List<OrderResponse> responses = orders.stream().map(order -> {
                        OrderResponse response = orderMapper.toResponse(order);
                        List<SubOrder> orderSubs = subOrdersByOrder.getOrDefault(order.getId(),
                                        Collections.emptyList());
                        response.setSubOrders(orderMapper.toSubOrderResponses(orderSubs));
                        return response;
                }).toList();

                return new PageImpl<>(responses, pageable, total);
        }

}