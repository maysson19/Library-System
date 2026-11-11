package com.library.dto;

public record SummaryResponse(long totalBooks, long totalCopies, long availableCopies,
                              long totalStudents, long activeLoans, long overdueLoans) {}
