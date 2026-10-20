package com.buy02.cart.service;

import java.util.ArrayList;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import com.buy02.cart.entity.Cart;
import com.buy02.cart.event.sales.CancelAuditEvent;
import com.buy02.cart.event.sales.SaleAuditEvent;
import com.buy02.cart.event.sales.SalesAuditEvent;
import com.buy02.cart.exception.custom.BadRequestException;
import com.buy02.cart.repository.CartRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class SalesEventConsumer {

    private final CartRepository cartRepository;

    @KafkaListener(topics = "sales-events", groupId = "cart-group", containerFactory = "salesContainer")
    public void consumeSalesEvent(SalesAuditEvent event) {

        log.info("Received sales event: {}", event);

        try {
            switch (event) {
                case SaleAuditEvent sale -> handleSale(sale);
                case CancelAuditEvent cancel -> {
                }
            }

            log.info("Successfully processed sales event: {}", event);

        } catch (Exception exc) {
            log.error("Failed to process sales event: {}", event, exc);
        }
    }

    private void handleSale(SaleAuditEvent sale) {

        Cart cart = cartRepository.findByUserId(sale.buyerId())
                .orElseThrow(() -> {
                    throw new BadRequestException(
                            "after successful order,"
                                    + " art was not found while trying to clear it");
                });

        cart.setItems(new ArrayList<>());
        cartRepository.save(cart);

        log.info("Cart cleared for user {}", sale.buyerId());

        log.info(
                "Updated product {} after sale. Quantity deducted: {}",
                sale.productId(),
                sale.quantity());
    }
}