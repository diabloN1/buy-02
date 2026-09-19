package com.buy02.cart.aop;

import com.buy02.cart.event.AuditEvent;
import com.buy02.cart.event.EntityType;
import com.buy02.cart.service.AuditEventProducer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;

import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditAspect {

        private final AuditEventProducer auditEventProducer;

        private final ExpressionParser expressionParser = new SpelExpressionParser();

        @AfterReturning(pointcut = "@annotation(auditable)", returning = "result")
        public void audit(
                        JoinPoint joinPoint,
                        Auditable auditable,
                        Object result) {
                try {
                        String entityId = resolveEntityId(
                                        joinPoint,
                                        auditable.entityId(),
                                        result);

                        String userId = getCurrentUserId();

                        boolean executedByAdmin = isCurrentUserAdmin();

                        AuditEvent event = new AuditEvent(
                                        entityId,
                                        EntityType.CART,
                                        auditable.action(),
                                        userId,
                                        executedByAdmin,
                                        Instant.now());

                        auditEventProducer.send(event);
                } catch (Exception e) {
                        log.error("Failed to process audit aspect for method: {}",
                                        joinPoint.getSignature().toShortString(), e);
                }
        }

        private String resolveEntityId(
                        JoinPoint joinPoint,
                        String expression,
                        Object result) {
                if (expression == null || expression.isBlank()) {
                        return null;
                }

                MethodSignature signature = (MethodSignature) joinPoint.getSignature();
                String[] parameterNames = signature.getParameterNames();
                Object[] parameterValues = joinPoint.getArgs();

                StandardEvaluationContext context = new StandardEvaluationContext();

                if (parameterNames != null) {
                        for (int i = 0; i < parameterNames.length; i++) {
                                context.setVariable(parameterNames[i], parameterValues[i]);
                        }
                }

                if (result != null) {
                        context.setVariable("result", result);
                }

                Object value = expressionParser.parseExpression(expression).getValue(context);
                return value != null ? value.toString() : null;
        }

        private String getCurrentUserId() {
                var authentication = SecurityContextHolder.getContext().getAuthentication();
                if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
                        return jwt.getSubject();
                }
                return "anonymous";
        }

        private boolean isCurrentUserAdmin() {
                var authentication = SecurityContextHolder.getContext().getAuthentication();
                if (authentication == null) {
                        return false;
                }
                return authentication.getAuthorities().stream()
                                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        }
}