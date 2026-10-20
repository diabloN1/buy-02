package com.buy01.audit.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.buy01.audit.dto.SellerAnalytics;
import com.buy01.audit.dto.UserAnalytics;
import com.buy01.audit.service.SaleAnalyticsServiceImpl;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/analytics")
@RequiredArgsConstructor
public class SaleAnalyticsController {

        private final SaleAnalyticsServiceImpl saleAnalyticsService;

        @GetMapping("/user")
        @PreAuthorize("isAuthenticated()")
        public ResponseEntity<UserAnalytics> getUserAnalytics(
                        @AuthenticationPrincipal Jwt jwt) {

                String userId = jwt.getSubject();

                return ResponseEntity.ok(
                                saleAnalyticsService.getUserAnalytics(
                                                userId));
        }

        @GetMapping("/seller")
        @PreAuthorize("hasRole('SELLER')")
        public ResponseEntity<SellerAnalytics> getSellerAnalytics(
                        @AuthenticationPrincipal Jwt jwt) {

                String sellerId = jwt.getSubject();

                return ResponseEntity.ok(
                                saleAnalyticsService.getSellerAnalytics(
                                                sellerId));
        }
}