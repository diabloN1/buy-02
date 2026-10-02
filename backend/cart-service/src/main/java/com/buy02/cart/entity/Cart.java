package com.buy02.cart.entity;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
@Document(collection = "carts")
public class Cart {
    @Data
    @Builder
    public static class Item {  
        private String productId;
        private Integer quantity;
    }

    @Id 
    private String id;
    
    @Indexed
    @Field("owner_id")
    private String userId;
    
    private List<Item> items;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Version
    private Long version;
}
