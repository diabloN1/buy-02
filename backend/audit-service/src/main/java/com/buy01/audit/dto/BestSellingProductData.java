package com.buy01.audit.dto;

import java.math.BigDecimal;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BestSellingProductData {

    private String productId;
    private String productName;
    private BigDecimal revenue;
    private long ordersCount;
}