package com.buy01.audit.service;

import com.buy01.audit.event.audit.AuditEvent;
import com.buy01.audit.event.sales.SalesAuditEvent;


public interface AuditService {

    public void consumeAudit(AuditEvent event);
    public void consumeSale(SalesAuditEvent event);

}
