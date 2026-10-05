package com.buy01.product.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@Document(collection = "categories")
public class Category {
    @Id
    private String id;

    @Indexed(unique = true)
    private String name;

    private String description;
}