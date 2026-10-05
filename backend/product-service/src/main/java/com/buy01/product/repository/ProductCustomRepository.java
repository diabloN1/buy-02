package com.buy01.product.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.buy01.product.DTOs.ProductSearchFilter;
import com.buy01.product.entity.Product;

public interface ProductCustomRepository {
    Page<Product> searchProducts(ProductSearchFilter filter, Pageable pageable);
}