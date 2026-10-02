package com.buy01.audit.entity;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.mapping.Document;

import com.buy01.audit.event.AuditAction;

import lombok.Builder;
import lombok.Data;

@Data
@Document(collection = "product")
@Builder
public class CartAudit {

    @Id
    private String id;

    private String cartId;

    private String executorId;

    private AuditAction action;

    private boolean isAdmin;

    private Instant timestamp;
    
    @Version
    private Long version;
}