package com.buy01.audit.repository;


import com.buy01.audit.entity.CartAudit;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface CartAuditRepo extends MongoRepository<CartAudit, String> {
    
}
