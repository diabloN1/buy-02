package com.__buy.user_service.dto;

import lombok.Builder;

@Builder
public record MediaResponse(
                String id,
                String path,
                String productId,
                String userId,
                String contentType) {
}