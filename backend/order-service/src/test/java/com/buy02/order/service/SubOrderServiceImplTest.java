package com.buy02.order.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
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

import com.buy02.order.dto.OrderResponse;
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
@DisplayName("SubOrderServiceImpl Unit Tests")
class SubOrderServiceImplTest {

        @Mock
        private OrderRepository orderRepository;

        @Mock
        private SubOrderRepository subOrderRepository;

        @Mock
        private OrderMapper orderMapper;

        @InjectMocks
        private SubOrderServiceImpl subOrderService;

        private static final String SUB_ORDER_ID = "sub-order-123";
        private static final String ORDER_ID = "order-123";
        private static final String USER_ID = "user-123";
        private static final String SELLER_ID = "seller-123";
        private static final String OTHER_SELLER_ID = "seller-456";

        private SubOrder subOrder;
        private Order order;

        @BeforeEach
        void setUp() {
                subOrder = SubOrder.builder()
                                .id(SUB_ORDER_ID)
                                .orderId(ORDER_ID)
                                .sellerId(SELLER_ID)
                                .items(new ArrayList<>())
                                .totalAmount(BigDecimal.valueOf(200))
                                .status(OrderStatus.PENDING)
                                .statusHistory(new ArrayList<>())
                                .deleted(false)
                                .build();

                order = Order.builder()
                                .id(ORDER_ID)
                                .userId(USER_ID)
                                .totalAmount(BigDecimal.valueOf(200))
                                .paymentMethod(Order.PaymentMethod.PAY_ON_DELIVERY)
                                .build();
        }

        @Nested
        @DisplayName("GetSubOrder")
        class GetSubOrder {

                @Test
                @DisplayName("should return suborder successfully")
                void success() {
                        // Given
                        when(subOrderRepository.findByIdAndDeletedFalse(SUB_ORDER_ID))
                                        .thenReturn(Optional.of(subOrder));

                        when(orderRepository.findById(ORDER_ID))
                                        .thenReturn(Optional.of(order));

                        OrderResponse response = new OrderResponse();

                        when(orderMapper.toResponse(order))
                                        .thenReturn(response);

                        when(orderMapper.toSubOrderResponses(anyList()))
                                        .thenReturn(new ArrayList<>());

                        // When
                        OrderResponse result = subOrderService.getSubOrder(
                                        SUB_ORDER_ID,
                                        SELLER_ID);

                        // Then
                        assertThat(result).isNotNull();

                        verify(subOrderRepository)
                                        .findByIdAndDeletedFalse(SUB_ORDER_ID);

                        verify(orderRepository)
                                        .findById(ORDER_ID);

                        verify(orderMapper)
                                        .toResponse(order);

                        verify(orderMapper)
                                        .toSubOrderResponses(anyList());
                }

                @Test
                @DisplayName("should throw when suborder does not exist")
                void notFound() {
                        // Given
                        when(subOrderRepository.findByIdAndDeletedFalse(SUB_ORDER_ID))
                                        .thenReturn(Optional.empty());

                        // When / Then
                        assertThatThrownBy(
                                        () -> subOrderService.getSubOrder(
                                                        SUB_ORDER_ID,
                                                        SELLER_ID))
                                        .isInstanceOf(NotFoundException.class)
                                        .hasMessageContaining("SubOrder not found");

                        verify(orderRepository, never())
                                        .findById(any());
                }

                @Test
                @DisplayName("should reject another seller")
                void forbidden() {
                        // Given
                        when(subOrderRepository.findByIdAndDeletedFalse(SUB_ORDER_ID))
                                        .thenReturn(Optional.of(subOrder));

                        // When / Then
                        assertThatThrownBy(
                                        () -> subOrderService.getSubOrder(
                                                        SUB_ORDER_ID,
                                                        OTHER_SELLER_ID))
                                        .isInstanceOf(ForbiddenException.class)
                                        .hasMessageContaining("permission");

                        verify(orderRepository, never())
                                        .findById(any());
                }

                @Test
                @DisplayName("should throw when parent order does not exist")
                void orderNotFound() {
                        // Given
                        when(subOrderRepository.findByIdAndDeletedFalse(SUB_ORDER_ID))
                                        .thenReturn(Optional.of(subOrder));

                        when(orderRepository.findById(ORDER_ID))
                                        .thenReturn(Optional.empty());

                        // When / Then
                        assertThatThrownBy(
                                        () -> subOrderService.getSubOrder(
                                                        SUB_ORDER_ID,
                                                        SELLER_ID))
                                        .isInstanceOf(NotFoundException.class)
                                        .hasMessageContaining("Order not found");

                        verify(orderMapper, never())
                                        .toResponse(any(Order.class));
                }
        }

        @Nested
        @DisplayName("GetOrdersBySellerId")
        class GetOrdersBySellerId {

                @Test
                @DisplayName("should return seller orders")
                void success() {
                        // Given
                        Pageable pageable = PageRequest.of(0, 10);

                        Page<SubOrder> page = new PageImpl<>(List.of(subOrder));

                        when(subOrderRepository.findBySellerIdAndDeletedFalse(
                                        SELLER_ID,
                                        pageable))
                                        .thenReturn(page);

                        when(orderRepository.findAllById(
                                        List.of(ORDER_ID)))
                                        .thenReturn(List.of(order));

                        when(orderMapper.toResponse(order))
                                        .thenReturn(new OrderResponse());

                        when(orderMapper.toSubOrderResponses(anyList()))
                                        .thenReturn(new ArrayList<>());

                        // When
                        Page<OrderResponse> result = subOrderService.getOrdersBySellerId(
                                        SELLER_ID,
                                        pageable);

                        // Then
                        assertThat(result.getContent())
                                        .hasSize(1);

                        verify(subOrderRepository)
                                        .findBySellerIdAndDeletedFalse(
                                                        SELLER_ID,
                                                        pageable);

                        verify(orderRepository)
                                        .findAllById(List.of(ORDER_ID));

                        verify(orderMapper)
                                        .toResponse(order);

                        verify(orderMapper)
                                        .toSubOrderResponses(anyList());
                }

                @Test
                @DisplayName("should return empty page")
                void empty() {
                        // Given
                        Pageable pageable = PageRequest.of(0, 10);

                        Page<SubOrder> page = Page.empty(pageable);

                        when(subOrderRepository.findBySellerIdAndDeletedFalse(
                                        SELLER_ID,
                                        pageable))
                                        .thenReturn(page);

                        when(orderRepository.findAllById(anyList()))
                                        .thenReturn(List.of());

                        // When
                        Page<OrderResponse> result = subOrderService.getOrdersBySellerId(
                                        SELLER_ID,
                                        pageable);

                        // Then
                        assertThat(result.getContent())
                                        .isEmpty();

                        verify(orderRepository)
                                        .findAllById(anyList());

                        verify(orderMapper, never())
                                        .toResponse(any(Order.class));
                }

        }

        @Nested
        @DisplayName("UpdateStatus")
        class UpdateStatus {

                @Test
                @DisplayName("should change pending to confirmed")
                void pendingToConfirmed() {
                        // Given
                        when(subOrderRepository.findByIdAndDeletedFalse(
                                        SUB_ORDER_ID))
                                        .thenReturn(Optional.of(subOrder));

                        // When
                        subOrderService.updateStatus(
                                        SUB_ORDER_ID,
                                        SELLER_ID,
                                        OrderStatus.CONFIRMED);

                        // Then
                        assertThat(subOrder.getStatus())
                                        .isEqualTo(OrderStatus.CONFIRMED);

                        assertThat(subOrder.getStatusHistory())
                                        .hasSize(1);

                        assertThat(subOrder.getStatusHistory()
                                        .get(0)
                                        .getStatus())
                                        .isEqualTo(OrderStatus.CONFIRMED);

                        assertThat(subOrder.getStatusHistory()
                                        .get(0)
                                        .getChangedBy())
                                        .isEqualTo(SELLER_ID);

                        assertThat(subOrder.getStatusHistory()
                                        .get(0)
                                        .getTimestamp())
                                        .isNotNull();

                        verify(subOrderRepository)
                                        .save(subOrder);
                }

                @Test
                @DisplayName("should change pending to cancelled")
                void pendingToCancelled() {
                        // Given
                        when(subOrderRepository.findByIdAndDeletedFalse(
                                        SUB_ORDER_ID))
                                        .thenReturn(Optional.of(subOrder));

                        // When
                        subOrderService.updateStatus(
                                        SUB_ORDER_ID,
                                        SELLER_ID,
                                        OrderStatus.CANCELLED);

                        // Then
                        assertThat(subOrder.getStatus())
                                        .isEqualTo(OrderStatus.CANCELLED);

                        assertThat(subOrder.getStatusHistory())
                                        .hasSize(1);

                        verify(subOrderRepository)
                                        .save(subOrder);
                }

                @Test
                @DisplayName("should change confirmed to shipped")
                void confirmedToShipped() {
                        // Given
                        subOrder.setStatus(
                                        OrderStatus.CONFIRMED);

                        when(subOrderRepository.findByIdAndDeletedFalse(
                                        SUB_ORDER_ID))
                                        .thenReturn(Optional.of(subOrder));

                        // When
                        subOrderService.updateStatus(
                                        SUB_ORDER_ID,
                                        SELLER_ID,
                                        OrderStatus.SHIPPED);

                        // Then
                        assertThat(subOrder.getStatus())
                                        .isEqualTo(OrderStatus.SHIPPED);

                        verify(subOrderRepository)
                                        .save(subOrder);
                }

                @Test
                @DisplayName("should change shipped to delivered")
                void shippedToDelivered() {
                        // Given
                        subOrder.setStatus(
                                        OrderStatus.SHIPPED);

                        when(subOrderRepository.findByIdAndDeletedFalse(
                                        SUB_ORDER_ID))
                                        .thenReturn(Optional.of(subOrder));

                        // When
                        subOrderService.updateStatus(
                                        SUB_ORDER_ID,
                                        SELLER_ID,
                                        OrderStatus.DELIVERED);

                        // Then
                        assertThat(subOrder.getStatus())
                                        .isEqualTo(OrderStatus.DELIVERED);

                        verify(subOrderRepository)
                                        .save(subOrder);
                }

                @Test
                @DisplayName("should reject invalid pending transition")
                void invalidPendingTransition() {
                        // Given
                        when(subOrderRepository.findByIdAndDeletedFalse(
                                        SUB_ORDER_ID))
                                        .thenReturn(Optional.of(subOrder));

                        // When / Then
                        assertThatThrownBy(
                                        () -> subOrderService.updateStatus(
                                                        SUB_ORDER_ID,
                                                        SELLER_ID,
                                                        OrderStatus.SHIPPED))
                                        .isInstanceOf(BadRequestException.class)
                                        .hasMessageContaining(
                                                        "Cannot update status from PENDING to SHIPPED");

                        verify(subOrderRepository, never())
                                        .save(any());
                }

                @Test
                @DisplayName("should reject transition from delivered")
                void deliveredNoTransition() {
                        // Given
                        subOrder.setStatus(
                                        OrderStatus.DELIVERED);

                        when(subOrderRepository.findByIdAndDeletedFalse(
                                        SUB_ORDER_ID))
                                        .thenReturn(Optional.of(subOrder));

                        // When / Then
                        assertThatThrownBy(
                                        () -> subOrderService.updateStatus(
                                                        SUB_ORDER_ID,
                                                        SELLER_ID,
                                                        OrderStatus.PENDING))
                                        .isInstanceOf(BadRequestException.class)
                                        .hasMessageContaining(
                                                        "No further transitions are allowed");

                        verify(subOrderRepository, never())
                                        .save(any());
                }

                @Test
                @DisplayName("should reject transition from cancelled")
                void cancelledNoTransition() {
                        // Given
                        subOrder.setStatus(
                                        OrderStatus.CANCELLED);

                        when(subOrderRepository.findByIdAndDeletedFalse(
                                        SUB_ORDER_ID))
                                        .thenReturn(Optional.of(subOrder));

                        // When / Then
                        assertThatThrownBy(
                                        () -> subOrderService.updateStatus(
                                                        SUB_ORDER_ID,
                                                        SELLER_ID,
                                                        OrderStatus.CONFIRMED))
                                        .isInstanceOf(BadRequestException.class)
                                        .hasMessageContaining(
                                                        "No further transitions are allowed");

                        verify(subOrderRepository, never())
                                        .save(any());
                }

                @Test
                @DisplayName("should reject another seller")
                void forbidden() {
                        // Given
                        when(subOrderRepository.findByIdAndDeletedFalse(
                                        SUB_ORDER_ID))
                                        .thenReturn(Optional.of(subOrder));

                        // When / Then
                        assertThatThrownBy(
                                        () -> subOrderService.updateStatus(
                                                        SUB_ORDER_ID,
                                                        OTHER_SELLER_ID,
                                                        OrderStatus.CONFIRMED))
                                        .isInstanceOf(ForbiddenException.class)
                                        .hasMessageContaining("permission");

                        verify(subOrderRepository, never())
                                        .save(any());
                }

                @Test
                @DisplayName("should throw when suborder does not exist")
                void notFound() {
                        // Given
                        when(subOrderRepository.findByIdAndDeletedFalse(
                                        SUB_ORDER_ID))
                                        .thenReturn(Optional.empty());

                        // When / Then
                        assertThatThrownBy(
                                        () -> subOrderService.updateStatus(
                                                        SUB_ORDER_ID,
                                                        SELLER_ID,
                                                        OrderStatus.CONFIRMED))
                                        .isInstanceOf(NotFoundException.class);

                        verify(subOrderRepository, never())
                                        .save(any());
                }
        }

        @Nested
        @DisplayName("DeleteSubOrder")
        class DeleteSubOrder {

                @Test
                @DisplayName("should delete cancelled suborder")
                void cancelled() {
                        // Given
                        subOrder.setStatus(
                                        OrderStatus.CANCELLED);

                        when(subOrderRepository.findByIdAndDeletedFalse(
                                        SUB_ORDER_ID))
                                        .thenReturn(Optional.of(subOrder));

                        // When
                        subOrderService.deleteSubOrder(
                                        SUB_ORDER_ID,
                                        SELLER_ID);

                        // Then
                        assertThat(subOrder.isDeleted())
                                        .isTrue();

                        verify(subOrderRepository)
                                        .save(subOrder);
                }

                @Test
                @DisplayName("should delete delivered suborder")
                void delivered() {
                        // Given
                        subOrder.setStatus(
                                        OrderStatus.DELIVERED);

                        when(subOrderRepository.findByIdAndDeletedFalse(
                                        SUB_ORDER_ID))
                                        .thenReturn(Optional.of(subOrder));

                        // When
                        subOrderService.deleteSubOrder(
                                        SUB_ORDER_ID,
                                        SELLER_ID);

                        // Then
                        assertThat(subOrder.isDeleted())
                                        .isTrue();

                        verify(subOrderRepository)
                                        .save(subOrder);
                }

                @Test
                @DisplayName("should reject pending suborder")
                void pending() {
                        // Given
                        subOrder.setStatus(
                                        OrderStatus.PENDING);

                        when(subOrderRepository.findByIdAndDeletedFalse(
                                        SUB_ORDER_ID))
                                        .thenReturn(Optional.of(subOrder));

                        // When / Then
                        assertThatThrownBy(
                                        () -> subOrderService.deleteSubOrder(
                                                        SUB_ORDER_ID,
                                                        SELLER_ID))
                                        .isInstanceOf(BadRequestException.class)
                                        .hasMessageContaining(
                                                        "Can't delete order if still in progress");

                        verify(subOrderRepository, never())
                                        .save(any());
                }

                @Test
                @DisplayName("should reject confirmed suborder")
                void confirmed() {
                        // Given
                        subOrder.setStatus(
                                        OrderStatus.CONFIRMED);

                        when(subOrderRepository.findByIdAndDeletedFalse(
                                        SUB_ORDER_ID))
                                        .thenReturn(Optional.of(subOrder));

                        // When / Then
                        assertThatThrownBy(
                                        () -> subOrderService.deleteSubOrder(
                                                        SUB_ORDER_ID,
                                                        SELLER_ID))
                                        .isInstanceOf(BadRequestException.class);

                        verify(subOrderRepository, never())
                                        .save(any());
                }

                @Test
                @DisplayName("should reject another seller")
                void forbidden() {
                        // Given
                        subOrder.setStatus(
                                        OrderStatus.DELIVERED);

                        when(subOrderRepository.findByIdAndDeletedFalse(
                                        SUB_ORDER_ID))
                                        .thenReturn(Optional.of(subOrder));

                        // When / Then
                        assertThatThrownBy(
                                        () -> subOrderService.deleteSubOrder(
                                                        SUB_ORDER_ID,
                                                        OTHER_SELLER_ID))
                                        .isInstanceOf(ForbiddenException.class);

                        verify(subOrderRepository, never())
                                        .save(any());
                }

                @Test
                @DisplayName("should throw when suborder does not exist")
                void notFound() {
                        // Given
                        when(subOrderRepository.findByIdAndDeletedFalse(
                                        SUB_ORDER_ID))
                                        .thenReturn(Optional.empty());

                        // When / Then
                        assertThatThrownBy(
                                        () -> subOrderService.deleteSubOrder(
                                                        SUB_ORDER_ID,
                                                        SELLER_ID))
                                        .isInstanceOf(NotFoundException.class);

                        verify(subOrderRepository, never())
                                        .save(any());
                }
        }
}
