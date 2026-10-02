package com.buy02.order.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateOrderRequest(
        @NotNull(message = "Payment method is required")
        String paymentMethod,

        @NotNull(message = "Shipping address is required")
        ShippingAddressRequest shippingAddress,

        @NotNull(message = "Total amount is required")
        @DecimalMin(value = "0.01", message = "Total amount must be greater than zero")
        BigDecimal totalAmount
) {
    public record OrderItemRequest(
            @NotBlank(message = "Product id is required")
            String productId,

            @NotBlank(message = "Product name is required")
            String productName,

            @NotNull(message = "Price is required")
            @DecimalMin(value = "0.00", message = "Price must be positive")
            BigDecimal price,

            @NotNull(message = "Quantity is required")
            @jakarta.validation.constraints.Min(value = 1, message = "Quantity must be at least 1")
            Integer quantity
    ) {}

    public record ShippingAddressRequest(
            @NotBlank(message = "Street is required")
            String street,

            @NotBlank(message = "City is required")
            String city,

            @NotBlank(message = "State is required")
            String state,

            @NotBlank(message = "Zip code is required")
            String zipCode,

            @NotBlank(message = "Country is required")
            String country,

            @NotBlank(message = "Phone is required")
            String phone
    ) {}
}