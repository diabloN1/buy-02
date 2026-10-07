package com.buy01.product.DTOs;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {

    private String id;

    private String name;

    private String description;

    private List<ProductImageResponse> images;

    private BigDecimal price;

    private String userId;

    private String categoryId;

    private String categoryName;

    private Integer quantity;

    private LocalDateTime createdAt;
}