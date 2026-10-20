package com.buy01.audit.repository;

import java.util.List;
import java.util.Set;

import com.buy01.audit.entity.SaleAudit;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface SaleAuditRepo extends MongoRepository<SaleAudit, String> {

    List<SaleAudit> findByproductIdIn(Set<String> productId);
}