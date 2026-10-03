package com.buy02.order.client;

import java.util.List;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.buy02.order.dto.ProductResponse;

@FeignClient(name = "PRODUCT-SERVICE")
public interface ProductClient {

    @PostMapping("/products/batch")
    List<ProductResponse> getProductsByIds(@RequestBody List<String> productIds);
}