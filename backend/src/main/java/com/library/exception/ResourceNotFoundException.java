package com.library.exception;

public class ResourceNotFoundException extends RuntimeException {
    private final Object[] args;

    public ResourceNotFoundException(String key, Object... args) {
        super(key);
        this.args = args;
    }

    public Object[] getArgs() { return args; }
}
