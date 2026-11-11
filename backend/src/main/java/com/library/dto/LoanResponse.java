package com.library.dto;

import java.time.LocalDate;

public record LoanResponse(
        Long id,
        Long studentId, String studentCode, String studentName,
        Long bookId, String bookTitle, String isbn,
        LocalDate borrowDate, LocalDate dueDate, LocalDate returnDate,
        String status, boolean overdue, long daysOverdue,
        String issuedBy, int renewCount, boolean canRenew) {}
