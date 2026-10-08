package com.buy01.audit.service;

import com.buy01.audit.dto.SellerAnalytics;
import com.buy01.audit.dto.UserAnalytics;

public interface SaleAnalyticsService {

    public UserAnalytics getUserAnalytics(String buyerId);

    public SellerAnalytics getSellerAnalytics(String sellerId);

}
