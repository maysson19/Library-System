package com.library.controller;

import com.library.exception.BusinessException;
import com.library.exception.ResourceNotFoundException;
import com.library.exception.TooManyAttemptsException;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

// Turns exceptions into JSON messages in the language of the request (Accept-Language header)
@RestControllerAdvice
@RequiredArgsConstructor
public class GlobalExceptionHandler {

    private final MessageSource messageSource;

    private String msg(String key, Object... args) {
        return messageSource.getMessage(key, args, key, LocaleContextHolder.getLocale());
    }

    private ResponseEntity<Map<String, String>> body(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("message", message));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, String>> badCredentials() {
        return body(HttpStatus.UNAUTHORIZED, msg("err.badCredentials"));
    }

    @ExceptionHandler(TooManyAttemptsException.class)
    public ResponseEntity<Map<String, String>> tooMany(TooManyAttemptsException ex) {
        return body(HttpStatus.TOO_MANY_REQUESTS, msg(ex.getMessage(), ex.getArgs()));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, String>> notFound(ResourceNotFoundException ex) {
        return body(HttpStatus.NOT_FOUND, msg(ex.getMessage(), ex.getArgs()));
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Map<String, String>> business(BusinessException ex) {
        return body(HttpStatus.BAD_REQUEST, msg(ex.getMessage(), ex.getArgs()));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> integrity() {
        return body(HttpStatus.CONFLICT, msg("err.conflict"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> validation(MethodArgumentNotValidException ex) {
        String field = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField())
                .findFirst().orElse("-");
        return body(HttpStatus.BAD_REQUEST, msg("err.validation", field));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> illegalArgument(IllegalArgumentException ex) {
        return body(HttpStatus.BAD_REQUEST, String.valueOf(ex.getMessage()));
    }
}
