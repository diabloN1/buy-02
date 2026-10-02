package com.buy02.order.mapper;

import java.util.List;

import org.mapstruct.Mapper;

import com.buy02.order.dto.CartResponse;
import com.buy02.order.dto.CreateOrderRequest;
import com.buy02.order.dto.OrderResponse;
import com.buy02.order.dto.SubOrderResponse;
import com.buy02.order.entity.Order;
import com.buy02.order.entity.SubOrder;

@Mapper(componentModel = "spring")
public interface OrderMapper {

        SubOrder.Item toOrderItem(
                        CartResponse.CartItemResponse item);

        List<SubOrder.Item> toOrderItems(
                        List<CartResponse.CartItemResponse> items);

        Order.ShippingAddress toShippingAddress(
                        CreateOrderRequest.ShippingAddressRequest address);

        OrderResponse toResponse(Order order);

        List<OrderResponse> toResponses(
                        List<Order> orders);

        SubOrderResponse toResponse(SubOrder subOrder);

        List<SubOrderResponse> toSubOrderResponses(
                        List<SubOrder> subOrders);

        SubOrderResponse.OrderItemResponse toItemResponse(
                        SubOrder.Item item);

        OrderResponse.ShippingAddressResponse toShippingAddressResponse(
                        Order.ShippingAddress address);
}