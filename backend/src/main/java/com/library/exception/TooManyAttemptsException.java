package com.library.exception;

public class TooManyAttemptsException extends RuntimeException {
    private final Object[] args;

    public TooManyAttemptsException(String key, Object... args) {
        super(key);
        this.args = args;
    }

    public Object[] getArgs() { return args; }
}
