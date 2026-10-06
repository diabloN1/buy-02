package com.buy01.audit.entity;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.mapping.Document;

import com.buy01.audit.event.audit.AuditAction;

import lombok.Builder;
import lombok.Data;

@Data
@Document(collection = "media")
@Builder
public class MediaAudit {

    @Id
    private String id;

    private String mediaId;

    private String executorId;

    private AuditAction action;

    private boolean isAdmin;

    private Instant timestamp;
    
    @Version
    private Long version;
}