package com.library.exception;

// message = key in messages.properties, args fill the {0}, {1} placeholders
public class BusinessException extends RuntimeException {
    private final Object[] args;

    public BusinessException(String key, Object... args) {
        super(key);
        this.args = args;
    }

    public Object[] getArgs() { return args; }
}
