package com.buy01.audit.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

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

    // --------------------------------------------------
    // USER AUDIT
    // --------------------------------------------------

    @Test
    void consumeAudit_WhenTypeIsUser_ShouldSaveUserAudit() {
        Instant now = Instant.now();

        AuditEvent event = new AuditEvent(
                "user-100",
                EntityType.USER,
                AuditAction.CREATED,
                "executor-999",
                true,
                now);

        auditService.consumeAudit(event);

        ArgumentCaptor<UserAudit> captor =
                ArgumentCaptor.forClass(UserAudit.class);

        verify(userRepo).save(captor.capture());

        verifyNoInteractions(
                productRepo,
                mediaRepo,
                cartRepo,
                orderRepo,
                saleRepo);

        UserAudit savedAudit = captor.getValue();

        assertEquals("user-100", savedAudit.getUserId());
        assertEquals("executor-999", savedAudit.getExecutorId());
        assertEquals(AuditAction.CREATED, savedAudit.getAction());
        assertTrue(savedAudit.isAdmin());
        assertEquals(now, savedAudit.getTimestamp());
    }

    // --------------------------------------------------
    // PRODUCT AUDIT
    // --------------------------------------------------

    @Test
    void consumeAudit_WhenTypeIsProduct_ShouldSaveProductAudit() {
        Instant now = Instant.now();

        AuditEvent event = new AuditEvent(
                "prod-200",
                EntityType.PRODUCT,
                AuditAction.MODIFIED,
                "executor-888",
                false,
                now);

        auditService.consumeAudit(event);

        ArgumentCaptor<ProductAudit> captor =
                ArgumentCaptor.forClass(ProductAudit.class);

        verify(productRepo).save(captor.capture());

        verifyNoInteractions(
                userRepo,
                mediaRepo,
                cartRepo,
                orderRepo,
                saleRepo);

        ProductAudit savedAudit = captor.getValue();

        assertEquals("prod-200", savedAudit.getProductId());
        assertEquals("executor-888", savedAudit.getExecutorId());
        assertEquals(AuditAction.MODIFIED, savedAudit.getAction());
        assertEquals(now, savedAudit.getTimestamp());
    }

    // --------------------------------------------------
    // MEDIA AUDIT
    // --------------------------------------------------

    @Test
    void consumeAudit_WhenTypeIsMedia_ShouldSaveMediaAudit() {
        Instant now = Instant.now();

        AuditEvent event = new AuditEvent(
                "media-300",
                EntityType.MEDIA,
                AuditAction.DELETED,
                "executor-777",
                true,
                now);

        auditService.consumeAudit(event);

        ArgumentCaptor<MediaAudit> captor =
                ArgumentCaptor.forClass(MediaAudit.class);

        verify(mediaRepo).save(captor.capture());

        verifyNoInteractions(
                userRepo,
                productRepo,
                cartRepo,
                orderRepo,
                saleRepo);

        MediaAudit savedAudit = captor.getValue();

        assertEquals("media-300", savedAudit.getMediaId());
        assertEquals("executor-777", savedAudit.getExecutorId());
        assertEquals(AuditAction.DELETED, savedAudit.getAction());
        assertTrue(savedAudit.isAdmin());
        assertEquals(now, savedAudit.getTimestamp());
    }

    // --------------------------------------------------
    // CART AUDIT
    // --------------------------------------------------

    @Test
    void consumeAudit_WhenTypeIsCart_ShouldSaveCartAudit() {
        Instant now = Instant.now();

        AuditEvent event = new AuditEvent(
                "cart-400",
                EntityType.CART,
                AuditAction.CREATED,
                "executor-666",
                true,
                now);

        auditService.consumeAudit(event);

        ArgumentCaptor<CartAudit> captor =
                ArgumentCaptor.forClass(CartAudit.class);

        verify(cartRepo).save(captor.capture());

        verifyNoInteractions(
                userRepo,
                productRepo,
                mediaRepo,
                orderRepo,
                saleRepo);

        CartAudit savedAudit = captor.getValue();

        assertEquals("cart-400", savedAudit.getCartId());
        assertEquals("executor-666", savedAudit.getExecutorId());
        assertEquals(AuditAction.CREATED, savedAudit.getAction());
        assertTrue(savedAudit.isAdmin());
        assertEquals(now, savedAudit.getTimestamp());
    }

    // --------------------------------------------------
    // ORDER AUDIT
    // --------------------------------------------------

    @Test
    void consumeAudit_WhenTypeIsOrder_ShouldSaveOrderAudit() {
        Instant now = Instant.now();

        AuditEvent event = new AuditEvent(
                "order-500",
                EntityType.ORDER,
                AuditAction.MODIFIED,
                "executor-555",
                false,
                now);

        auditService.consumeAudit(event);

        ArgumentCaptor<OrderAudit> captor =
                ArgumentCaptor.forClass(OrderAudit.class);

        verify(orderRepo).save(captor.capture());

        verifyNoInteractions(
                userRepo,
                productRepo,
                mediaRepo,
                cartRepo,
                saleRepo);

        OrderAudit savedAudit = captor.getValue();

        assertEquals("order-500", savedAudit.getOrderId());
        assertEquals("executor-555", savedAudit.getExecutorId());
        assertEquals(AuditAction.MODIFIED, savedAudit.getAction());
        assertEquals(now, savedAudit.getTimestamp());
    }

    // --------------------------------------------------
    // SALE AUDIT
    // --------------------------------------------------

    @Test
    void consumeSale_WhenEventIsSale_ShouldSaveSaleAudit() {
        Instant now = Instant.now();
        BigDecimal itemPrice = new BigDecimal("199.99");

        SaleAuditEvent event = new SaleAuditEvent(
                "buyer-100",
                "seller-200",
                "suborder-300",
                "product-400",
                "ELECTRONICS",
                itemPrice,
                2,
                now);

        auditService.consumeSale(event);

        ArgumentCaptor<SaleAudit> captor =
                ArgumentCaptor.forClass(SaleAudit.class);

        verify(saleRepo).save(captor.capture());

        verifyNoInteractions(
                userRepo,
                productRepo,
                mediaRepo,
                cartRepo,
                orderRepo);

        SaleAudit savedAudit = captor.getValue();

        assertEquals("buyer-100", savedAudit.getBuyerId());
        assertEquals("seller-200", savedAudit.getSellerId());
        assertEquals("suborder-300", savedAudit.getSubOrderId());
        assertEquals("product-400", savedAudit.getProductId());
        assertEquals("ELECTRONICS", savedAudit.getCategory());
        assertEquals(itemPrice, savedAudit.getItemPrice());
        assertEquals(2, savedAudit.getQuantity());
        assertEquals(now, savedAudit.getCreatedAt());
    }

    // --------------------------------------------------
    // SALE CANCELLATION
    // --------------------------------------------------

    @Test
    void consumeSale_WhenEventIsCancellation_ShouldMarkSalesAsCanceled() {
        Instant now = Instant.now();

        SaleAudit sale1 = SaleAudit.builder()
                .buyerId("buyer-100")
                .sellerId("seller-200")
                .subOrderId("suborder-300")
                .productId("product-400")
                .category("ELECTRONICS")
                .itemPrice(new BigDecimal("199.99"))
                .quantity(2)
                .createdAt(now)
                .build();

        SaleAudit sale2 = SaleAudit.builder()
                .buyerId("buyer-100")
                .sellerId("seller-200")
                .subOrderId("suborder-300")
                .productId("product-500")
                .category("ACCESSORIES")
                .itemPrice(new BigDecimal("49.99"))
                .quantity(1)
                .createdAt(now)
                .build();

        when(saleRepo.findBySubOrderId("suborder-300"))
                .thenReturn(List.of(sale1, sale2));

        CancelAuditEvent event =
                new CancelAuditEvent("suborder-300", true);

        auditService.consumeSale(event);

        verify(saleRepo).findBySubOrderId("suborder-300");

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<SaleAudit>> captor =
                (ArgumentCaptor<List<SaleAudit>>) (ArgumentCaptor<?>)
                        ArgumentCaptor.forClass(List.class);

        verify(saleRepo).saveAll(captor.capture());

        List<SaleAudit> savedSales = captor.getValue();

        assertEquals(2, savedSales.size());

        for (SaleAudit sale : savedSales) {
            assertTrue(sale.isCanceled());
            assertNotNull(sale.getUpdatedAt());
        }

        assertEquals("product-400", savedSales.get(0).getProductId());
        assertEquals("product-500", savedSales.get(1).getProductId());

        verifyNoInteractions(
                userRepo,
                productRepo,
                mediaRepo,
                cartRepo,
                orderRepo);
    }

    // --------------------------------------------------
    // CANCELLATION WITHOUT MATCHING SALES
    // --------------------------------------------------

    @Test
    void consumeSale_WhenCancellationHasNoSales_ShouldSaveEmptyList() {
        when(saleRepo.findBySubOrderId("suborder-999"))
                .thenReturn(List.of());

        CancelAuditEvent event =
                new CancelAuditEvent("suborder-999", true);

        auditService.consumeSale(event);

        verify(saleRepo).findBySubOrderId("suborder-999");
        verify(saleRepo).saveAll(List.of());

        verifyNoInteractions(
                userRepo,
                productRepo,
                mediaRepo,
                cartRepo,
                orderRepo);
    }
}