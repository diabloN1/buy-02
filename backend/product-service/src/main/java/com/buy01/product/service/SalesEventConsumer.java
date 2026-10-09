package com.buy01.product.service;

import java.util.List;
import java.util.Map;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import com.buy01.product.entity.Product;
import com.buy01.product.event.sales.CancelAuditEvent;
import com.buy01.product.event.sales.SaleAuditEvent;
import com.buy01.product.event.sales.SalesAuditEvent;
import com.buy01.product.exception.custom.NotFoundException;
import com.buy01.product.repository.ProductRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class SalesEventConsumer {

    private final ProductRepository productRepository;

    @KafkaListener(topics = "sales-events", groupId = "product-group", containerFactory = "salesContainer")
    public void consumeSalesEvent(SalesAuditEvent event) {

        log.info("Received sales event: {}", event);

        try {
            switch (event) {
                case SaleAuditEvent sale -> handleSale(sale);
                case CancelAuditEvent cancel -> handleCancellation(cancel);
            }

            log.info("Successfully processed sales event: {}", event);

        } catch (Exception exc) {
            log.error("Failed to process sales event: {}", event, exc);
        }
    }

    private void handleSale(SaleAuditEvent sale) {

        Product product = findProductEntityById(sale.productId());

        product.setQuantity(product.getQuantity() - sale.quantity());

        productRepository.save(product);

        log.info(
                "Updated product {} after sale. Quantity deducted: {}",
                sale.productId(),
                sale.quantity());
    }

    private void handleCancellation(CancelAuditEvent cancel) {

        Map<String, Integer> productByQuantity = cancel.productByQuantity();

        List<Product> canceledProducts = productRepository.findByIdIn(productByQuantity.keySet());

        for (Product product : canceledProducts) {

            Integer quantity = productByQuantity.get(product.getId());
            product.setQuantity(product.getQuantity() + quantity);
        }

        productRepository.saveAll(canceledProducts);

        if (canceledProducts.size() != productByQuantity.size()) {
            log.warn(
                    "Some products were not found while processing cancellation {}",
                    cancel.subOrderId());
        }

        log.info(
                "Restored product quantities for canceled sub-order {}",
                cancel.subOrderId());
    }

    private Product findProductEntityById(String id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Product with ID " + id + " not found"));
    }
}