package com.buy02.cart.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
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

import com.buy02.cart.DTOs.AddToCartRequest;
import com.buy02.cart.DTOs.CartResponse;
import com.buy02.cart.DTOs.ProductResponse;
import com.buy02.cart.DTOs.UpdateCartItemRequest;
import com.buy02.cart.client.ProductClient;
import com.buy02.cart.entity.Cart;
import com.buy02.cart.entity.Cart.Item;
import com.buy02.cart.exception.custom.BadRequestException;
import com.buy02.cart.exception.custom.NotFoundException;
import com.buy02.cart.repository.CartRepository;

@ExtendWith(MockitoExtension.class)
@DisplayName("CartServiceImpl Unit Tests")
class CartServiceImplTest {

    @Mock
    private CartRepository cartRepository;

    @Mock
    private ProductClient productClient;

    @InjectMocks
    private CartServiceImpl cartService;

    private static final String USER_ID    = "user-123";
    private static final String PRODUCT_ID = "product-123";
    private static final String CART_ID    = "cart-123";

    private Cart emptyCart;
    private Cart cartWithItem;
    private Item existingItem;
    private ProductResponse product;

    @BeforeEach
    void setUp() {
        existingItem = Item.builder()
                .productId(PRODUCT_ID)
                .quantity(2)
                .build();

        emptyCart = Cart.builder()
                .id(CART_ID)
                .userId(USER_ID)
                .items(new ArrayList<>())
                .build();

        cartWithItem = Cart.builder()
                .id(CART_ID)
                .userId(USER_ID)
                .items(new ArrayList<>(List.of(existingItem)))
                .build();

        product = ProductResponse.builder()
                .id(PRODUCT_ID)
                .name("Wireless Mouse")
                .price(BigDecimal.valueOf(29.99))
                .quantity(10)
                .images(List.of())
                .build();
    }

    // -----------------------------------------------------------------------
    // getCart()
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("getCart()")
    class GetCart {

        @Test
        @DisplayName("should return CartResponse when cart exists for user")
        void getCart_cartExists_returnsCartResponse() {

            // given
            when(cartRepository.findByUserId(USER_ID))
                    .thenReturn(Optional.of(emptyCart));

            // when
            CartResponse result = cartService.getCart(USER_ID);

            // then
            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(CART_ID);
            assertThat(result.getUserId()).isEqualTo(USER_ID);
            assertThat(result.getItems()).isEmpty();
        }

        @Test
        @DisplayName("should create and return new cart when none exists for user")
        void getCart_cartNotFound_createsAndReturnsNewCart() {

            // given
            Cart newCart = Cart.builder()
                    .id(USER_ID)
                    .userId(USER_ID)
                    .items(new ArrayList<>())
                    .build();

            when(cartRepository.findByUserId(USER_ID))
                    .thenReturn(Optional.empty());
            when(cartRepository.save(any(Cart.class)))
                    .thenReturn(newCart);

            // when
            CartResponse result = cartService.getCart(USER_ID);

            // then
            assertThat(result).isNotNull();
            assertThat(result.getUserId()).isEqualTo(USER_ID);
            verify(cartRepository).save(any(Cart.class));
        }

        @Test
        @DisplayName("should call productClient when cart has items")
        void getCart_cartHasItems_callsProductClient() {

            // given
            when(cartRepository.findByUserId(USER_ID))
                    .thenReturn(Optional.of(cartWithItem));
            when(productClient.getProductsByIds(List.of(PRODUCT_ID)))
                    .thenReturn(List.of(product));

            // when
            CartResponse result = cartService.getCart(USER_ID);

            // then
            assertThat(result).isNotNull();
            assertThat(result.getItems()).hasSize(1);
            assertThat(result.getItems().get(0).getProductId()).isEqualTo(PRODUCT_ID);
            verify(productClient).getProductsByIds(List.of(PRODUCT_ID));
        }
    }

    // -----------------------------------------------------------------------
    // addToCart()
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("addToCart()")
    class AddToCart {

        private AddToCartRequest request;

        @BeforeEach
        void setUp() {
            request = new AddToCartRequest(PRODUCT_ID, 2);
        }

        @Test
        @DisplayName("should add item and return updated CartResponse")
        void addToCart_success_returnsUpdatedCart() {

            // given
            when(cartRepository.findByUserId(USER_ID))
                    .thenReturn(Optional.of(emptyCart));
            when(productClient.getProductById(PRODUCT_ID))
                    .thenReturn(product);
            when(cartRepository.save(any(Cart.class)))
                    .thenReturn(emptyCart);
            when(productClient.getProductsByIds(any()))
                    .thenReturn(List.of(product));

            // when
            CartResponse result = cartService.addToCart(request, USER_ID);

            // then
            assertThat(result).isNotNull();
            verify(cartRepository).save(emptyCart);
        }

        @Test
        @DisplayName("should throw BadRequestException when requested quantity exceeds stock")
        void addToCart_insufficientStock_throwsBadRequestException() {

            // given
            AddToCartRequest overStockRequest = new AddToCartRequest(PRODUCT_ID, 99);

            when(cartRepository.findByUserId(USER_ID))
                    .thenReturn(Optional.of(emptyCart));
            when(productClient.getProductById(PRODUCT_ID))
                    .thenReturn(product); // product.quantity = 10

            // when / then
            assertThatThrownBy(() -> cartService.addToCart(overStockRequest, USER_ID))
                    .isInstanceOf(BadRequestException.class);

            verify(cartRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw BadRequestException when item is already in cart")
        void addToCart_itemAlreadyInCart_throwsBadRequestException() {

            // given
            when(cartRepository.findByUserId(USER_ID))
                    .thenReturn(Optional.of(cartWithItem));
            when(productClient.getProductById(PRODUCT_ID))
                    .thenReturn(product);

            // when / then
            assertThatThrownBy(() -> cartService.addToCart(request, USER_ID))
                    .isInstanceOf(BadRequestException.class);

            verify(cartRepository, never()).save(any());
        }

        @Test
        @DisplayName("should create new cart when user has no existing cart")
        void addToCart_noExistingCart_createsCartAndAddsItem() {

            // given
            Cart newCart = Cart.builder()
                    .id(USER_ID)
                    .userId(USER_ID)
                    .items(new ArrayList<>())
                    .build();

            when(cartRepository.findByUserId(USER_ID))
                    .thenReturn(Optional.empty());
            when(cartRepository.save(any(Cart.class)))
                    .thenReturn(newCart);
            when(productClient.getProductById(PRODUCT_ID))
                    .thenReturn(product);
            when(productClient.getProductsByIds(any()))
                    .thenReturn(List.of(product));

            // when
            CartResponse result = cartService.addToCart(request, USER_ID);

            // then
            assertThat(result).isNotNull();
        }
    }

    // -----------------------------------------------------------------------
    // updateItemQuantity()
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("updateItemQuantity()")
    class UpdateItemQuantity {

        private UpdateCartItemRequest request;

        @BeforeEach
        void setUp() {
            request = new UpdateCartItemRequest(5);
        }

        @Test
        @DisplayName("should update item quantity and return updated CartResponse")
        void updateItemQuantity_success_returnsUpdatedCart() {

            // given
            when(cartRepository.findByUserId(USER_ID))
                    .thenReturn(Optional.of(cartWithItem));
            when(productClient.getProductById(PRODUCT_ID))
                    .thenReturn(product); // stock = 10
            when(cartRepository.save(any(Cart.class)))
                    .thenReturn(cartWithItem);
            when(productClient.getProductsByIds(any()))
                    .thenReturn(List.of(product));

            // when
            CartResponse result = cartService.updateItemQuantity(PRODUCT_ID, request, USER_ID);

            // then
            assertThat(result).isNotNull();
            assertThat(existingItem.getQuantity()).isEqualTo(5);
            verify(cartRepository).save(cartWithItem);
        }

        @Test
        @DisplayName("should throw NotFoundException when product is not in cart")
        void updateItemQuantity_itemNotInCart_throwsNotFoundException() {

            // given
            when(cartRepository.findByUserId(USER_ID))
                    .thenReturn(Optional.of(emptyCart));
            when(productClient.getProductById(PRODUCT_ID))
                    .thenReturn(product);

            // when / then
            assertThatThrownBy(
                    () -> cartService.updateItemQuantity(PRODUCT_ID, request, USER_ID))
                    .isInstanceOf(NotFoundException.class);

            verify(cartRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw BadRequestException when requested quantity exceeds available stock")
        void updateItemQuantity_exceedsStock_throwsBadRequestException() {

            // given
            UpdateCartItemRequest overStockRequest = new UpdateCartItemRequest(99);

            when(cartRepository.findByUserId(USER_ID))
                    .thenReturn(Optional.of(cartWithItem));
            when(productClient.getProductById(PRODUCT_ID))
                    .thenReturn(product); // stock = 10

            // when / then
            assertThatThrownBy(
                    () -> cartService.updateItemQuantity(PRODUCT_ID, overStockRequest, USER_ID))
                    .isInstanceOf(BadRequestException.class);

            verify(cartRepository, never()).save(any());
        }
    }

    // -----------------------------------------------------------------------
    // removeCartItem()
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("removeCartItem()")
    class RemoveCartItem {

        @Test
        @DisplayName("should remove item and return updated CartResponse")
        void removeCartItem_success_returnsUpdatedCart() {

            // given
            when(cartRepository.findByUserId(USER_ID))
                    .thenReturn(Optional.of(cartWithItem));
            when(cartRepository.save(any(Cart.class)))
                    .thenReturn(cartWithItem);

            // when
            CartResponse result = cartService.removeCartItem(PRODUCT_ID, USER_ID);

            // then
            assertThat(result).isNotNull();
            assertThat(cartWithItem.getItems()).isEmpty();
            verify(cartRepository).save(cartWithItem);
        }

        @Test
        @DisplayName("should throw NotFoundException when product is not in cart")
        void removeCartItem_itemNotFound_throwsNotFoundException() {

            // given
            when(cartRepository.findByUserId(USER_ID))
                    .thenReturn(Optional.of(emptyCart));

            // when / then
            assertThatThrownBy(
                    () -> cartService.removeCartItem(PRODUCT_ID, USER_ID))
                    .isInstanceOf(NotFoundException.class);

            verify(cartRepository, never()).save(any());
        }
    }

    // -----------------------------------------------------------------------
    // clearCart()
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("clearCart()")
    class ClearCart {

        @Test
        @DisplayName("should clear all items and save the cart")
        void clearCart_success_emptiesItemsAndSaves() {

            // given
            when(cartRepository.findByUserId(USER_ID))
                    .thenReturn(Optional.of(cartWithItem));
            when(cartRepository.save(any(Cart.class)))
                    .thenReturn(cartWithItem);

            // when
            cartService.clearCart(USER_ID);

            // then
            assertThat(cartWithItem.getItems()).isEmpty();
            verify(cartRepository).save(cartWithItem);
        }

        @Test
        @DisplayName("should create new empty cart and save it when user has no cart")
        void clearCart_noExistingCart_createsAndSavesEmptyCart() {

            // given
            Cart newCart = Cart.builder()
                    .id(USER_ID)
                    .userId(USER_ID)
                    .items(new ArrayList<>())
                    .build();

            when(cartRepository.findByUserId(USER_ID))
                    .thenReturn(Optional.empty());
            when(cartRepository.save(any(Cart.class)))
                    .thenReturn(newCart);

            // when
            cartService.clearCart(USER_ID);

            // then – save is called twice: once to persist the new cart (resolveCartByUserId),
            // and once to persist the cleared (empty) cart inside clearCart()
            verify(cartRepository, org.mockito.Mockito.times(2)).save(any(Cart.class));
        }
    }

    // -----------------------------------------------------------------------
    // getItemQuantity()
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("getItemQuantity()")
    class GetItemQuantity {

        @Test
        @DisplayName("should return the quantity of the item when it exists in the cart")
        void getItemQuantity_itemExists_returnsQuantity() {

            // given
            when(cartRepository.findByUserId(USER_ID))
                    .thenReturn(Optional.of(cartWithItem));

            // when
            Integer result = cartService.getItemQuantity(USER_ID, PRODUCT_ID);

            // then
            assertThat(result).isEqualTo(2);
        }

        @Test
        @DisplayName("should return 0 when item is not in the cart")
        void getItemQuantity_itemNotInCart_returnsZero() {

            // given
            when(cartRepository.findByUserId(USER_ID))
                    .thenReturn(Optional.of(emptyCart));

            // when
            Integer result = cartService.getItemQuantity(USER_ID, PRODUCT_ID);

            // then
            assertThat(result).isZero();
        }

        @Test
        @DisplayName("should return 0 when cart has null items list")
        void getItemQuantity_nullItemsList_returnsZero() {

            // given
            Cart cartWithNullItems = Cart.builder()
                    .id(CART_ID)
                    .userId(USER_ID)
                    .items(null)
                    .build();

            when(cartRepository.findByUserId(USER_ID))
                    .thenReturn(Optional.of(cartWithNullItems));

            // when
            Integer result = cartService.getItemQuantity(USER_ID, PRODUCT_ID);

            // then
            assertThat(result).isZero();
        }

        @Test
        @DisplayName("should return 0 for a different productId not in the cart")
        void getItemQuantity_differentProductId_returnsZero() {

            // given
            when(cartRepository.findByUserId(USER_ID))
                    .thenReturn(Optional.of(cartWithItem));

            // when
            Integer result = cartService.getItemQuantity(USER_ID, "other-product-id");

            // then
            assertThat(result).isZero();
        }
    }
}
