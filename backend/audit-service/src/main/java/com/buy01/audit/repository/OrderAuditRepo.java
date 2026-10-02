package com.buy01.audit.repository;


import com.buy01.audit.entity.OrderAudit;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface OrderAuditRepo extends MongoRepository<OrderAudit, String> {
    
}
