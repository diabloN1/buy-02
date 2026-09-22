package com.buy02.cart.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.buy02.cart.DTOs.AddToCartRequest;
import com.buy02.cart.DTOs.CartItemResponse;
import com.buy02.cart.DTOs.CartResponse;
import com.buy02.cart.DTOs.ProductResponse;
import com.buy02.cart.DTOs.UpdateCartItemRequest;
import com.buy02.cart.aop.Auditable;
import com.buy02.cart.client.ProductClient;
import com.buy02.cart.entity.Cart;
import com.buy02.cart.entity.Cart.Item;
import com.buy02.cart.event.AuditAction;
import com.buy02.cart.exception.custom.BadRequestException;
import com.buy02.cart.exception.custom.NotFoundException;
import com.buy02.cart.repository.CartRepository;

@Slf4j
@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final ProductClient productClient;

    @Override
    public CartResponse getCart(String userId) {
        Cart cart = resolveCartByUserId(userId);
        return mapToResponse(cart);
    }

    @Override
    @Auditable(action = AuditAction.CREATED, entityId = "#result.id")
    public CartResponse addToCart(AddToCartRequest request, String userId) {

        Cart cart = resolveCartByUserId(userId);

        ProductResponse product = productClient.getProductById(request.productId());

        if (product.getQuantity() < request.quantity()) {
            throw new BadRequestException("Product stock is bellow quantity wanted.");
        }

        Optional<Item> existingItem = cart.getItems().stream()
                .filter(item -> item.getProductId().equals(request.productId()))
                .findFirst();

        if (existingItem.isPresent()) {
            throw new BadRequestException("Product already in cart. Use update quantity.");
        }

        Item newItem = Item.builder()
                .productId(request.productId())
                .quantity(request.quantity())
                .build();

        if (cart.getItems() == null) {
            cart.setItems(new ArrayList<>());
        }
        cart.getItems().add(newItem);

        cart.setUserId(userId);
        Cart saved = cartRepository.save(cart);

        return mapToResponse(saved);
    }

    @Override
    @Auditable(action = AuditAction.MODIFIED, entityId = "#result.id")
    public CartResponse updateItemQuantity(String productId, UpdateCartItemRequest request, String userId) {

        Cart cart = resolveCartByUserId(userId);
        ProductResponse product = productClient.getProductById(productId);

        Item item = cart.getItems().stream()
                .filter(i -> i.getProductId().equals(productId))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Product " + productId + " not found in cart"));

        if (product.getQuantity() < item.getQuantity() + request.quantity()) {
            throw new BadRequestException("The wanted quantity is not available in stock");
        }

        item.setQuantity(request.quantity());

        Cart updated = cartRepository.save(cart);
        return mapToResponse(updated);
    }

    @Override
    @Auditable(action = AuditAction.DELETED, entityId = "#result.id")
    public CartResponse removeCartItem(String productId, String userId) {

        Cart cart = resolveCartByUserId(userId);

        boolean removed = cart.getItems().removeIf(item -> item.getProductId().equals(productId));

        if (!removed) {
            throw new NotFoundException("Product " + productId + " not found in cart");
        }

        Cart updated = cartRepository.save(cart);
        return mapToResponse(updated);
    }

    @Override
    @Auditable(action = AuditAction.MODIFIED, entityId = "#result.id")
    public void clearCart(String userId) {
        Cart cart = resolveCartByUserId(userId);
        cart.setItems(new ArrayList<>());
        cartRepository.save(cart);
        log.info("Cart cleared for user {}", userId);
    }

    @Override
    public Integer getItemQuantity(String userId, String productId) {
        Cart cart = resolveCartByUserId(userId);

        if (cart.getItems() == null) {
            return 0;
        }

        Item item = cart.getItems().stream()
                .filter(i -> i.getProductId().equals(productId))
                .findFirst()
                .orElse(null);

        if (item == null) {
            return 0;
        }

        return item.getQuantity();
    }


    private Cart resolveCartByUserId(String userId) {
        return cartRepository.findByUserId(userId)
                .orElseGet(() -> {
                    Cart newCart = Cart.builder()
                            .id(userId)
                            .userId(userId)
                            .items(new ArrayList<>())
                            .build();

                    return cartRepository.save(newCart);
                });
    }

    private CartResponse mapToResponse(Cart cart) {
        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            return CartResponse.from(cart, List.of());
        }

        List<String> productIds = cart.getItems().stream()
                .map(Item::getProductId)
                .toList();

        List<ProductResponse> products = productClient.getProductsByIds(productIds);

        Map<String, ProductResponse> productMap = products.stream()
                .collect(Collectors.toMap(
                        ProductResponse::getId,
                        product -> product
                ));

        List<CartItemResponse> items = cart.getItems().stream()
                .map(item -> CartItemResponse.from(item, productMap.get(item.getProductId())))
                .toList();

        return CartResponse.from(cart, items);
    }
}
