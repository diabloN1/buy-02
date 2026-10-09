package com.buy01.audit.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.buy01.audit.entity.CartAudit;
import com.buy01.audit.entity.MediaAudit;
import com.buy01.audit.entity.OrderAudit;
import com.buy01.audit.entity.ProductAudit;
import com.buy01.audit.entity.SaleAudit;
import com.buy01.audit.entity.UserAudit;
import com.buy01.audit.event.audit.AuditAction;
import com.buy01.audit.event.audit.AuditEvent;
import com.buy01.audit.event.audit.EntityType;
import com.buy01.audit.event.sales.CancelAuditEvent;
import com.buy01.audit.event.sales.SaleAuditEvent;
import com.buy01.audit.repository.CartAuditRepo;
import com.buy01.audit.repository.MediaAuditRepo;
import com.buy01.audit.repository.OrderAuditRepo;
import com.buy01.audit.repository.ProductAuditRepo;
import com.buy01.audit.repository.SaleAuditRepo;
import com.buy01.audit.repository.UserAuditRepo;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuditServiceImpl Unit Tests")
class AuditServiceImplTest {

    @Mock
    private MediaAuditRepo mediaRepo;

    @Mock
    private ProductAuditRepo productRepo;

    @Mock
    private UserAuditRepo userRepo;

    @Mock
    private CartAuditRepo cartRepo;

    @Mock
    private OrderAuditRepo orderRepo;

    @Mock
    private SaleAuditRepo saleRepo;

    @InjectMocks
    private AuditServiceImpl auditService;

    private static final String EXECUTOR_ID = "executor-999";
    private static final String BUYER_ID = "buyer-100";
    private static final String SELLER_ID = "seller-200";
    private static final String SUB_ORDER_ID = "suborder-300";
    private static final String PRODUCT_ID_1 = "product-400";
    private static final String PRODUCT_ID_2 = "product-500";

    private Instant now;

    @BeforeEach
    void setUp() {
        now = Instant.now();
    }

    @Nested
    @DisplayName("consumeAudit()")
    class ConsumeAudit {

        @Nested
        @DisplayName("USER")
        class UserAuditTests {

            @Test
            @DisplayName("Should save user audit")
            void shouldSaveUserAudit() {
                // given
                AuditEvent event = new AuditEvent(
                        "user-100",
                        EntityType.USER,
                        AuditAction.CREATED,
                        EXECUTOR_ID,
                        true,
                        now);

                // when
                auditService.consumeAudit(event);

                // then
                ArgumentCaptor<UserAudit> captor =
                        ArgumentCaptor.forClass(UserAudit.class);

                verify(userRepo).save(captor.capture());

                verifyNoInteractions(
                        productRepo, mediaRepo, cartRepo, orderRepo, saleRepo);

                UserAudit savedAudit = captor.getValue();

                assertThat(savedAudit.getUserId()).isEqualTo("user-100");
                assertThat(savedAudit.getExecutorId()).isEqualTo(EXECUTOR_ID);
                assertThat(savedAudit.getAction()).isEqualTo(AuditAction.CREATED);
                assertThat(savedAudit.isAdmin()).isTrue();
                assertThat(savedAudit.getTimestamp()).isEqualTo(now);
            }
        }

        @Nested
        @DisplayName("PRODUCT")
        class ProductAuditTests {

            @Test
            @DisplayName("Should save product audit")
            void shouldSaveProductAudit() {
                // given
                AuditEvent event = new AuditEvent(
                        "prod-200",
                        EntityType.PRODUCT,
                        AuditAction.MODIFIED,
                        EXECUTOR_ID,
                        false,
                        now);

                // when
                auditService.consumeAudit(event);

                // then
                ArgumentCaptor<ProductAudit> captor =
                        ArgumentCaptor.forClass(ProductAudit.class);

                verify(productRepo).save(captor.capture());

                verifyNoInteractions(
                        userRepo, mediaRepo, cartRepo, orderRepo, saleRepo);

                ProductAudit savedAudit = captor.getValue();

                assertThat(savedAudit.getProductId()).isEqualTo("prod-200");
                assertThat(savedAudit.getExecutorId()).isEqualTo(EXECUTOR_ID);
                assertThat(savedAudit.getAction()).isEqualTo(AuditAction.MODIFIED);
                assertThat(savedAudit.isAdmin()).isFalse();
                assertThat(savedAudit.getTimestamp()).isEqualTo(now);
            }
        }

        @Nested
        @DisplayName("MEDIA")
        class MediaAuditTests {

            @Test
            @DisplayName("Should save media audit")
            void shouldSaveMediaAudit() {
                // given
                AuditEvent event = new AuditEvent(
                        "media-300",
                        EntityType.MEDIA,
                        AuditAction.DELETED,
                        EXECUTOR_ID,
                        true,
                        now);

                // when
                auditService.consumeAudit(event);

                // then
                ArgumentCaptor<MediaAudit> captor =
                        ArgumentCaptor.forClass(MediaAudit.class);

                verify(mediaRepo).save(captor.capture());

                verifyNoInteractions(
                        userRepo, productRepo, cartRepo, orderRepo, saleRepo);

                MediaAudit savedAudit = captor.getValue();

                assertThat(savedAudit.getMediaId()).isEqualTo("media-300");
                assertThat(savedAudit.getExecutorId()).isEqualTo(EXECUTOR_ID);
                assertThat(savedAudit.getAction()).isEqualTo(AuditAction.DELETED);
                assertThat(savedAudit.isAdmin()).isTrue();
                assertThat(savedAudit.getTimestamp()).isEqualTo(now);
            }
        }

        @Nested
        @DisplayName("CART")
        class CartAuditTests {

            @Test
            @DisplayName("Should save cart audit")
            void shouldSaveCartAudit() {
                // given
                AuditEvent event = new AuditEvent(
                        "cart-400",
                        EntityType.CART,
                        AuditAction.CREATED,
                        EXECUTOR_ID,
                        true,
                        now);

                // when
                auditService.consumeAudit(event);

                // then
                ArgumentCaptor<CartAudit> captor =
                        ArgumentCaptor.forClass(CartAudit.class);

                verify(cartRepo).save(captor.capture());

                verifyNoInteractions(
                        userRepo, productRepo, mediaRepo, orderRepo, saleRepo);

                CartAudit savedAudit = captor.getValue();

                assertThat(savedAudit.getCartId()).isEqualTo("cart-400");
                assertThat(savedAudit.getExecutorId()).isEqualTo(EXECUTOR_ID);
                assertThat(savedAudit.getAction()).isEqualTo(AuditAction.CREATED);
                assertThat(savedAudit.isAdmin()).isTrue();
                assertThat(savedAudit.getTimestamp()).isEqualTo(now);
            }
        }

        @Nested
        @DisplayName("ORDER")
        class OrderAuditTests {

            @Test
            @DisplayName("Should save order audit")
            void shouldSaveOrderAudit() {
                // given
                AuditEvent event = new AuditEvent(
                        "order-500",
                        EntityType.ORDER,
                        AuditAction.MODIFIED,
                        EXECUTOR_ID,
                        false,
                        now);

                // when
                auditService.consumeAudit(event);

                // then
                ArgumentCaptor<OrderAudit> captor =
                        ArgumentCaptor.forClass(OrderAudit.class);

                verify(orderRepo).save(captor.capture());

                verifyNoInteractions(
                        userRepo, productRepo, mediaRepo, cartRepo, saleRepo);

                OrderAudit savedAudit = captor.getValue();

                assertThat(savedAudit.getOrderId()).isEqualTo("order-500");
                assertThat(savedAudit.getExecutorId()).isEqualTo(EXECUTOR_ID);
                assertThat(savedAudit.getAction()).isEqualTo(AuditAction.MODIFIED);
                assertThat(savedAudit.isAdmin()).isFalse();
                assertThat(savedAudit.getTimestamp()).isEqualTo(now);
            }
        }
    }

    @Nested
    @DisplayName("consumeSale()")
    class ConsumeSale {

        @Nested
        @DisplayName("SaleAuditEvent")
        class SaleAuditTests {

            @Test
            @DisplayName("Should save sale audit")
            void shouldSaveSaleAudit() {
                // given
                BigDecimal itemPrice = new BigDecimal("199.99");

                SaleAuditEvent event = new SaleAuditEvent(
                        BUYER_ID,
                        SELLER_ID,
                        SUB_ORDER_ID,
                        PRODUCT_ID_1,
                        "ELECTRONICS",
                        itemPrice,
                        2,
                        now);

                // when
                auditService.consumeSale(event);

                // then
                ArgumentCaptor<SaleAudit> captor =
                        ArgumentCaptor.forClass(SaleAudit.class);

                verify(saleRepo).save(captor.capture());

                verifyNoInteractions(
                        userRepo, productRepo, mediaRepo, cartRepo, orderRepo);

                SaleAudit savedAudit = captor.getValue();

                assertThat(savedAudit.getBuyerId()).isEqualTo(BUYER_ID);
                assertThat(savedAudit.getSellerId()).isEqualTo(SELLER_ID);
                assertThat(savedAudit.getSubOrderId()).isEqualTo(SUB_ORDER_ID);
                assertThat(savedAudit.getProductId()).isEqualTo(PRODUCT_ID_1);
                assertThat(savedAudit.getCategory()).isEqualTo("ELECTRONICS");
                assertThat(savedAudit.getItemPrice()).isEqualByComparingTo(itemPrice);
                assertThat(savedAudit.getQuantity()).isEqualTo(2);
                assertThat(savedAudit.getCreatedAt()).isEqualTo(now);
            }
        }

        @Nested
        @DisplayName("CancelAuditEvent")
        class CancelAuditTests {

            @Test
            @DisplayName("Should mark all sales for the suborder as canceled")
            void shouldMarkSalesAsCanceled() {
                // given
                SaleAudit sale1 = createSale(
                        PRODUCT_ID_1,
                        "ELECTRONICS",
                        "199.99",
                        2);

                SaleAudit sale2 = createSale(
                        PRODUCT_ID_2,
                        "ACCESSORIES",
                        "49.99",
                        1);

                when(saleRepo.findBySubOrderId(SUB_ORDER_ID))
                        .thenReturn(List.of(sale1, sale2));

                CancelAuditEvent event =
                        new CancelAuditEvent(SUB_ORDER_ID, true);

                // when
                auditService.consumeSale(event);

                // then
                @SuppressWarnings("unchecked")
                ArgumentCaptor<List<SaleAudit>> captor =
                        (ArgumentCaptor<List<SaleAudit>>) (ArgumentCaptor<?>)
                                ArgumentCaptor.forClass(List.class);

                verify(saleRepo).findBySubOrderId(SUB_ORDER_ID);
                verify(saleRepo).saveAll(captor.capture());

                List<SaleAudit> savedSales = captor.getValue();

                assertThat(savedSales)
                        .hasSize(2)
                        .allSatisfy(sale -> {
                            assertThat(sale.isCanceled()).isTrue();
                            assertThat(sale.getUpdatedAt()).isNotNull();
                        });

                assertThat(savedSales)
                        .extracting(SaleAudit::getProductId)
                        .containsExactly(PRODUCT_ID_1, PRODUCT_ID_2);

                verifyNoInteractions(
                        userRepo, productRepo, mediaRepo, cartRepo, orderRepo);
            }

            @Test
            @DisplayName("Should save an empty list when no sales match the suborder")
            void shouldSaveEmptyListWhenNoSalesMatch() {
                // given
                when(saleRepo.findBySubOrderId(SUB_ORDER_ID))
                        .thenReturn(List.of());

                CancelAuditEvent event =
                        new CancelAuditEvent(SUB_ORDER_ID, true);

                // when
                auditService.consumeSale(event);

                // then
                verify(saleRepo).findBySubOrderId(SUB_ORDER_ID);
                verify(saleRepo).saveAll(List.of());

                verifyNoInteractions(
                        userRepo, productRepo, mediaRepo, cartRepo, orderRepo);
            }
        }
    }

    private SaleAudit createSale(
            String productId,
            String category,
            String itemPrice,
            int quantity) {

        return SaleAudit.builder()
                .buyerId(BUYER_ID)
                .sellerId(SELLER_ID)
                .subOrderId(SUB_ORDER_ID)
                .productId(productId)
                .category(category)
                .itemPrice(new BigDecimal(itemPrice))
                .quantity(quantity)
                .createdAt(now)
                .build();
    }
}