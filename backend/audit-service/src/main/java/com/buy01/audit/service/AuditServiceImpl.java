package com.buy01.audit.service;

import java.time.Instant;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import com.buy01.audit.entity.CartAudit;
import com.buy01.audit.entity.MediaAudit;
import com.buy01.audit.entity.OrderAudit;
import com.buy01.audit.entity.ProductAudit;
import com.buy01.audit.entity.SaleAudit;
import com.buy01.audit.entity.UserAudit;
import com.buy01.audit.event.audit.AuditEvent;
import com.buy01.audit.event.sales.CancelAuditEvent;
import com.buy01.audit.event.sales.SaleAuditEvent;
import com.buy01.audit.event.sales.SalesAuditEvent;
import com.buy01.audit.repository.CartAuditRepo;
import com.buy01.audit.repository.MediaAuditRepo;
import com.buy01.audit.repository.OrderAuditRepo;
import com.buy01.audit.repository.ProductAuditRepo;
import com.buy01.audit.repository.SaleAuditRepo;
import com.buy01.audit.repository.UserAuditRepo;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuditServiceImpl {

    private final MediaAuditRepo mediaRepo;
    private final ProductAuditRepo productRepo;
    private final UserAuditRepo userRepo;
    private final CartAuditRepo cartRepo;
    private final OrderAuditRepo orderRepo;
    private final SaleAuditRepo saleRepo;

    @KafkaListener(topics = "audit-events", groupId = "audit-group", containerFactory = "auditContainer")
    public void consumeAudit(AuditEvent event) {

        switch (event.entityType()) {
            case USER:
                UserAudit userAudit = UserAudit
                        .builder()
                        .userId(event.entityId())
                        .executorId(event.executorId())
                        .action(event.action())
                        .isAdmin(event.isAdmin())
                        .timestamp(event.timestamp())
                        .build();

                userRepo.save(userAudit);
                break;

            case PRODUCT:
                ProductAudit productAudit = ProductAudit
                        .builder()
                        .productId(event.entityId())
                        .executorId(event.executorId())
                        .action(event.action())
                        .isAdmin(event.isAdmin())
                        .timestamp(event.timestamp())
                        .build();

                productRepo.save(productAudit);
                break;

            case MEDIA:
                MediaAudit mediaAudit = MediaAudit
                        .builder()
                        .mediaId(event.entityId())
                        .executorId(event.executorId())
                        .action(event.action())
                        .isAdmin(event.isAdmin())
                        .timestamp(event.timestamp())
                        .build();

                mediaRepo.save(mediaAudit);
                break;

            case CART:
                CartAudit cartAudit = CartAudit
                        .builder()
                        .cartId(event.entityId())
                        .executorId(event.executorId())
                        .action(event.action())
                        .isAdmin(event.isAdmin())
                        .timestamp(event.timestamp())
                        .build();

                cartRepo.save(cartAudit);
                break;

            case ORDER:
                OrderAudit orderAudit = OrderAudit
                        .builder()
                        .orderId(event.entityId())
                        .executorId(event.executorId())
                        .action(event.action())
                        .isAdmin(event.isAdmin())
                        .timestamp(event.timestamp())
                        .build();

                orderRepo.save(orderAudit);
                break;
        }
    }

    @KafkaListener(topics = "sales-events", groupId = "audit-group", containerFactory = "salesContainer")
    public void consumeSale(SalesAuditEvent event) {

        switch (event) {
            case SaleAuditEvent sale -> {
                SaleAudit saleAudit = SaleAudit
                        .builder()
                        .buyerId(sale.buyerId())
                        .sellerId(sale.sellerId())
                        .productId(sale.productId())
                        .category(sale.category())
                        .itemPrice(sale.itemPrice())
                        .quantity(sale.quantity())
                        .createdAt(sale.timestamp())
                        .build();

                saleRepo.save(saleAudit);
            }

            case CancelAuditEvent cancel -> {
                var sales = saleRepo.findByproductIdIn(cancel.productByQuantity().keySet()).stream().map(sale -> {
                    sale.setCanceled(true);
                    sale.setUpdatedAt(Instant.now());
                    return sale;
                }).toList();

                saleRepo.saveAll(sales);
            }
        }
    }
}
