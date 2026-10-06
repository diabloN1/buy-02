package com.buy01.audit.entity;

import java.math.BigDecimal;
import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Builder;
import lombok.Data;

@Data
@Document(collection = "sale")
@Builder
public class SaleAudit {

    @Id
    private String id;

    private String buyerId;
    private String sellerId;

    private String subOrderId;
    private String productId;
    private String category;

    private BigDecimal itemPrice;
    private Integer quantity;

    private boolean canceled;

    private Instant createdAt;
    private Instant updatedAt;

    @Version
    private Long version;
}