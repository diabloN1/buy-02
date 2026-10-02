package com.buy02.cart.exception.custom;

public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }
}