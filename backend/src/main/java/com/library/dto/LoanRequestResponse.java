package com.library.dto;

import java.time.LocalDateTime;

public record LoanRequestResponse(
        Long id, String type, String status,
        Long studentId, String studentCode, String studentName,
        Long bookId, String bookTitle, String isbn,
        Long loanId,
        LocalDateTime createdAt, LocalDateTime decidedAt, String decidedBy,
        String reason, boolean unread,
        StudentStanding standing) {}
