package com.buy02.order.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.buy02.order.client.CartClient;
import com.buy02.order.client.ProductClient;
import com.buy02.order.dto.CartResponse;
import com.buy02.order.dto.CreateOrderRequest;
import com.buy02.order.dto.OrderResponse;
import com.buy02.order.dto.ProductResponse;
import com.buy02.order.entity.Order;
import com.buy02.order.entity.Order.OrderStatus;
import com.buy02.order.entity.SubOrder;
import com.buy02.order.exception.custom.BadRequestException;
import com.buy02.order.exception.custom.ForbiddenException;
import com.buy02.order.exception.custom.NotFoundException;
import com.buy02.order.mapper.OrderMapper;
import com.buy02.order.repository.OrderRepository;
import com.buy02.order.repository.SubOrderRepository;

@ExtendWith(MockitoExtension.class)
@DisplayName("OrderServiceImpl Unit Tests")
class OrderServiceImplTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private SubOrderRepository subOrderRepository;

    @Mock
    private CartClient cartClient;

    @Mock
    private ProductClient productClient;

    @Mock
    private OrderMapper orderMapper;

    @InjectMocks
    private OrderServiceImpl orderService;

    private static final String ORDER_ID = "order-123";
    private static final String NEW_ORDER_ID = "order-456";
    private static final String USER_ID = "user-123";
    private static final String OTHER_USER_ID = "user-456";
    private static final String SELLER_ID = "seller-123";
    private static final String PRODUCT_ID = "product-123";

    private static final BigDecimal PRICE = BigDecimal.valueOf(100);

    private Order order;
    private SubOrder subOrder;

    @BeforeEach
    void setUp() {
        order = Order.builder()
                .id(ORDER_ID)
                .userId(USER_ID)
                .totalAmount(BigDecimal.valueOf(200))
                .paymentMethod(Order.PaymentMethod.PAY_ON_DELIVERY)
                .build();

        subOrder = SubOrder.builder()
                .id("sub-123")
                .orderId(ORDER_ID)
                .sellerId(SELLER_ID)
                .items(new ArrayList<>())
                .totalAmount(BigDecimal.valueOf(200))
                .status(OrderStatus.PENDING)
                .statusHistory(new ArrayList<>())
                .build();
    }

    @Nested
    @DisplayName("CreateOrder")
    class CreateOrder {

        @Test
        @DisplayName("should create order successfully")
        void success() {
            // Given
            CreateOrderRequest request = mock(CreateOrderRequest.class);

            when(request.totalAmount())
                    .thenReturn(BigDecimal.valueOf(200));

            CartResponse.CartItemResponse item = mockCartItem(PRICE, 2);

            CartResponse cart = mockCart(List.of(item));

            Order.ShippingAddress shippingAddress = mock(
                    Order.ShippingAddress.class);

            when(cartClient.getCart())
                    .thenReturn(cart);

            when(orderMapper.toShippingAddress(any()))
                    .thenReturn(shippingAddress);

            when(orderRepository.save(any()))
                    .thenReturn(order);

            when(orderMapper.toOrderItems(anyList()))
                    .thenReturn(new ArrayList<>());

            when(subOrderRepository.saveAll(anyList()))
                    .thenReturn(List.of(subOrder));

            when(orderMapper.toResponse(order))
                    .thenReturn(new OrderResponse());

            when(orderMapper.toSubOrderResponses(anyList()))
                    .thenReturn(new ArrayList<>());

            // When
            OrderResponse result = orderService.createOrder(USER_ID, request);

            // Then
            assertThat(result).isNotNull();

            verify(cartClient).getCart();
            verify(orderRepository).save(any());
            verify(subOrderRepository).saveAll(anyList());
        }

        @Test
        @DisplayName("should reject empty cart")
        void emptyCart() {
            // Given
            CreateOrderRequest request = mock(CreateOrderRequest.class);

            CartResponse cart = mockCart(List.of());

            when(cartClient.getCart())
                    .thenReturn(cart);

            // When / Then
            assertThatThrownBy(
                    () -> orderService.createOrder(USER_ID, request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Cart is empty");

            verify(orderRepository, never()).save(any());
            verify(subOrderRepository, never()).saveAll(anyList());
        }

        @Test
        @DisplayName("should reject total mismatch")
        void totalMismatch() {
            // Given
            CreateOrderRequest request = mock(CreateOrderRequest.class);

            when(request.totalAmount())
                    .thenReturn(BigDecimal.valueOf(999));

            CartResponse.CartItemResponse item = mockCartItem(PRICE, 2);

            CartResponse cart = mockCart(List.of(item));

            when(cartClient.getCart())
                    .thenReturn(cart);

            // When / Then
            assertThatThrownBy(
                    () -> orderService.createOrder(USER_ID, request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Order total mismatch");

            verify(orderRepository, never()).save(any());
            verify(subOrderRepository, never()).saveAll(anyList());
        }
    }

    @Nested
    @DisplayName("GetOrder")
    class GetOrder {

        @Test
        @DisplayName("should return order")
        void success() {
            // Given
            when(orderRepository.findByIdAndDeletedFalse(ORDER_ID))
                    .thenReturn(Optional.of(order));

            when(subOrderRepository.findByOrderId(ORDER_ID))
                    .thenReturn(List.of(subOrder));

            OrderResponse response = new OrderResponse();

            when(orderMapper.toResponse(order))
                    .thenReturn(response);

            when(orderMapper.toSubOrderResponses(anyList()))
                    .thenReturn(new ArrayList<>());

            // When
            OrderResponse result = orderService.getOrder(ORDER_ID, USER_ID);

            // Then
            assertThat(result).isNotNull();

            verify(orderRepository)
                    .findByIdAndDeletedFalse(ORDER_ID);

            verify(subOrderRepository)
                    .findByOrderId(ORDER_ID);

            verify(orderMapper)
                    .toResponse(order);
        }

        @Test
        @DisplayName("should throw when order does not exist")
        void notFound() {
            // Given
            when(orderRepository.findByIdAndDeletedFalse(ORDER_ID))
                    .thenReturn(Optional.empty());

            // When / Then
            assertThatThrownBy(
                    () -> orderService.getOrder(
                            ORDER_ID,
                            USER_ID))
                    .isInstanceOf(NotFoundException.class);

            verify(subOrderRepository, never())
                    .findByOrderId(any());
        }

        @Test
        @DisplayName("should reject another user")
        void forbidden() {
            // Given
            when(orderRepository.findByIdAndDeletedFalse(ORDER_ID))
                    .thenReturn(Optional.of(order));

            // When / Then
            assertThatThrownBy(
                    () -> orderService.getOrder(
                            ORDER_ID,
                            OTHER_USER_ID))
                    .isInstanceOf(ForbiddenException.class);

            verify(subOrderRepository, never())
                    .findByOrderId(any());
        }
    }

    @Nested
    @DisplayName("GetOrdersByUser")
    class GetOrdersByUser {

        @Test
        @DisplayName("should return paginated orders")
        void success() {
            // Given
            Pageable pageable = PageRequest.of(0, 10);

            Page<Order> page = new PageImpl<>(List.of(order));

            when(orderRepository.findByUserIdAndDeletedFalse(
                    USER_ID,
                    pageable))
                    .thenReturn(page);

            when(subOrderRepository.findByOrderIdIn(
                    List.of(ORDER_ID)))
                    .thenReturn(List.of(subOrder));

            when(orderMapper.toResponse(order))
                    .thenReturn(new OrderResponse());

            when(orderMapper.toSubOrderResponses(anyList()))
                    .thenReturn(new ArrayList<>());

            // When
            Page<OrderResponse> result = orderService.getOrdersByUser(
                    USER_ID,
                    pageable);

            // Then
            assertThat(result.getContent())
                    .hasSize(1);

            verify(orderRepository)
                    .findByUserIdAndDeletedFalse(
                            USER_ID,
                            pageable);

            verify(subOrderRepository)
                    .findByOrderIdIn(
                            List.of(ORDER_ID));
        }

        @Test
        @DisplayName("should return empty page")
        void empty() {
            // Given
            Pageable pageable = PageRequest.of(0, 10);

            when(orderRepository.findByUserIdAndDeletedFalse(
                    USER_ID,
                    pageable))
                    .thenReturn(Page.empty(pageable));

            // When
            Page<OrderResponse> result = orderService.getOrdersByUser(
                    USER_ID,
                    pageable);

            // Then
            assertThat(result.getContent())
                    .isEmpty();

            verify(subOrderRepository, never())
                    .findByOrderIdIn(anyList());
        }
    }

    @Nested
    @DisplayName("CancelOrder")
    class CancelOrder {

        @Test
        @DisplayName("should cancel pending order")
        void success() {
            // Given
            when(orderRepository.findByIdAndDeletedFalse(ORDER_ID))
                    .thenReturn(Optional.of(order));

            when(subOrderRepository.findByOrderId(ORDER_ID))
                    .thenReturn(List.of(subOrder));

            when(subOrderRepository.saveAll(anyList()))
                    .thenReturn(List.of(subOrder));

            // When
            orderService.cancelOrder(
                    ORDER_ID,
                    USER_ID);

            // Then
            assertThat(subOrder.getStatus())
                    .isEqualTo(OrderStatus.CANCELLED);

            assertThat(subOrder.getStatusHistory())
                    .hasSize(1);

            verify(subOrderRepository)
                    .saveAll(anyList());
        }

        @Test
        @DisplayName("should reject non-pending order")
        void notPending() {
            // Given
            subOrder.setStatus(
                    OrderStatus.CONFIRMED);

            when(orderRepository.findByIdAndDeletedFalse(ORDER_ID))
                    .thenReturn(Optional.of(order));

            when(subOrderRepository.findByOrderId(ORDER_ID))
                    .thenReturn(List.of(subOrder));

            // When / Then
            assertThatThrownBy(
                    () -> orderService.cancelOrder(
                            ORDER_ID,
                            USER_ID))
                    .isInstanceOf(BadRequestException.class);

            verify(subOrderRepository, never())
                    .saveAll(anyList());
        }

        @Test
        @DisplayName("should reject another user")
        void forbidden() {
            // Given
            when(orderRepository.findByIdAndDeletedFalse(ORDER_ID))
                    .thenReturn(Optional.of(order));

            // When / Then
            assertThatThrownBy(
                    () -> orderService.cancelOrder(
                            ORDER_ID,
                            OTHER_USER_ID))
                    .isInstanceOf(ForbiddenException.class);

            verify(subOrderRepository, never())
                    .findByOrderId(any());
        }
    }

    @Nested
    @DisplayName("RedoOrder")
    class RedoOrder {

        @Test
        @DisplayName("should redo order when stock is available")
        void success() {
            // Given
            SubOrder.Item item = SubOrder.Item.builder()
                    .productId(PRODUCT_ID)
                    .productName("Product")
                    .price(PRICE)
                    .quantity(2)
                    .build();

            subOrder.setItems(List.of(item));

            ProductResponse product = mock(
                    ProductResponse.class);

            when(product.getId())
                    .thenReturn(PRODUCT_ID);

            when(product.getQuantity())
                    .thenReturn(10);

            Order newOrder = Order.builder()
                    .id(NEW_ORDER_ID)
                    .userId(USER_ID)
                    .build();

            SubOrder newSubOrder = SubOrder.builder()
                    .id("new-sub")
                    .build();

            when(orderRepository.findByIdAndDeletedFalse(ORDER_ID))
                    .thenReturn(Optional.of(order));

            when(subOrderRepository.findByOrderId(ORDER_ID))
                    .thenReturn(List.of(subOrder));

            when(productClient.getProductsByIds(
                    List.of(PRODUCT_ID)))
                    .thenReturn(List.of(product));

            when(orderMapper.copyOrder(order))
                    .thenReturn(newOrder);

            when(orderRepository.save(newOrder))
                    .thenReturn(newOrder);

            when(orderMapper.copySubOrder(subOrder))
                    .thenReturn(newSubOrder);

            // When
            orderService.redoOrder(
                    ORDER_ID,
                    USER_ID);

            // Then
            assertThat(newSubOrder.getOrderId())
                    .isEqualTo(NEW_ORDER_ID);

            verify(orderRepository)
                    .save(newOrder);

            verify(subOrderRepository)
                    .saveAll(anyList());
        }

        @Test
        @DisplayName("should reject unavailable product")
        void productUnavailable() {
            // Given
            SubOrder.Item item = SubOrder.Item.builder()
                    .productId(PRODUCT_ID)
                    .productName("Product")
                    .price(PRICE)
                    .quantity(2)
                    .build();

            subOrder.setItems(List.of(item));

            when(orderRepository.findByIdAndDeletedFalse(ORDER_ID))
                    .thenReturn(Optional.of(order));

            when(subOrderRepository.findByOrderId(ORDER_ID))
                    .thenReturn(List.of(subOrder));

            when(productClient.getProductsByIds(
                    List.of(PRODUCT_ID)))
                    .thenReturn(List.of());

            // When / Then
            assertThatThrownBy(
                    () -> orderService.redoOrder(
                            ORDER_ID,
                            USER_ID))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining(
                            "Product no longer available");

            verify(orderRepository, never())
                    .save(any());

            verify(subOrderRepository, never())
                    .saveAll(anyList());
        }

        @Test
        @DisplayName("should reject insufficient stock")
        void insufficientStock() {
            // Given
            SubOrder.Item item = SubOrder.Item.builder()
                    .productId(PRODUCT_ID)
                    .productName("Product")
                    .price(PRICE)
                    .quantity(10)
                    .build();

            subOrder.setItems(List.of(item));

            ProductResponse product = mock(
                    ProductResponse.class);

            when(product.getId())
                    .thenReturn(PRODUCT_ID);

            when(product.getQuantity())
                    .thenReturn(5);

            when(orderRepository.findByIdAndDeletedFalse(ORDER_ID))
                    .thenReturn(Optional.of(order));

            when(subOrderRepository.findByOrderId(ORDER_ID))
                    .thenReturn(List.of(subOrder));

            when(productClient.getProductsByIds(
                    List.of(PRODUCT_ID)))
                    .thenReturn(List.of(product));

            // When / Then
            assertThatThrownBy(
                    () -> orderService.redoOrder(
                            ORDER_ID,
                            USER_ID))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining(
                            "Insufficient stock");

            verify(orderRepository, never())
                    .save(any());

            verify(subOrderRepository, never())
                    .saveAll(anyList());
        }
    }

    @Nested
    @DisplayName("DeleteOrder")
    class DeleteOrder {

        @Test
        @DisplayName("should delete delivered order")
        void delivered() {
            // Given
            subOrder.setStatus(
                    OrderStatus.DELIVERED);

            when(orderRepository.findByIdAndDeletedFalse(ORDER_ID))
                    .thenReturn(Optional.of(order));

            when(subOrderRepository.findByOrderId(ORDER_ID))
                    .thenReturn(List.of(subOrder));

            // When
            orderService.deleteOrder(
                    ORDER_ID,
                    USER_ID);

            // Then
            assertThat(order.isDeleted())
                    .isTrue();

            verify(orderRepository)
                    .save(order);
        }

        @Test
        @DisplayName("should delete cancelled order")
        void cancelled() {
            // Given
            subOrder.setStatus(
                    OrderStatus.CANCELLED);

            when(orderRepository.findByIdAndDeletedFalse(ORDER_ID))
                    .thenReturn(Optional.of(order));

            when(subOrderRepository.findByOrderId(ORDER_ID))
                    .thenReturn(List.of(subOrder));

            // When
            orderService.deleteOrder(
                    ORDER_ID,
                    USER_ID);

            // Then
            assertThat(order.isDeleted())
                    .isTrue();

            verify(orderRepository)
                    .save(order);
        }

        @Test
        @DisplayName("should reject order still in progress")
        void inProgress() {
            // Given
            subOrder.setStatus(
                    OrderStatus.CONFIRMED);

            when(orderRepository.findByIdAndDeletedFalse(ORDER_ID))
                    .thenReturn(Optional.of(order));

            when(subOrderRepository.findByOrderId(ORDER_ID))
                    .thenReturn(List.of(subOrder));

            // When / Then
            assertThatThrownBy(
                    () -> orderService.deleteOrder(
                            ORDER_ID,
                            USER_ID))
                    .isInstanceOf(BadRequestException.class);

            verify(orderRepository, never())
                    .save(any());
        }

        @Test
        @DisplayName("should reject another user")
        void forbidden() {
            // Given
            when(orderRepository.findByIdAndDeletedFalse(ORDER_ID))
                    .thenReturn(Optional.of(order));

            // When / Then
            assertThatThrownBy(
                    () -> orderService.deleteOrder(
                            ORDER_ID,
                            OTHER_USER_ID))
                    .isInstanceOf(ForbiddenException.class);

            verify(subOrderRepository, never())
                    .findByOrderId(any());
        }
    }

    private CartResponse mockCart(
            List<CartResponse.CartItemResponse> items) {

        CartResponse cart = mock(
                CartResponse.class);

        when(cart.getItems())
                .thenReturn(items);

        return cart;
    }

    private CartResponse.CartItemResponse mockCartItem(
            BigDecimal price,
            int quantity) {

        return CartResponse.CartItemResponse.builder()
                .productId(PRODUCT_ID)
                .ownerId(SELLER_ID)
                .productName("Product")
                .price(price)
                .quantity(quantity)
                .imageUrl(null)
                .availableStock(10)
                .build();
    }
}