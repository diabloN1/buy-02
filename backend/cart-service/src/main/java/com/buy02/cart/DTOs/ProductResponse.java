package com.buy02.cart.DTOs;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ProductResponse {

    private String id;

    private String name;

    private String description;

    private List<ProductImageResponse> images;

    private BigDecimal price;

    private String userId;

    private Integer quantity;

    private LocalDateTime createdAt;
}
