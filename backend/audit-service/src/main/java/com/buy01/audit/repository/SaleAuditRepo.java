package com.buy01.audit.repository;

import java.util.Optional;

import com.buy01.audit.entity.SaleAudit;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface SaleAuditRepo extends MongoRepository<SaleAudit, String> {

    Optional<SaleAudit> findBySubOrderId(String subOrderId);
}