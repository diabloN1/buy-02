package com.buy01.audit.dto;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BestSellingProductData {

    private String productId;

    private BigDecimal revenue;

    private Integer ordersCount;
}