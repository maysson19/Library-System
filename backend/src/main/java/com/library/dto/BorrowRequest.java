package com.library.dto;

import jakarta.validation.constraints.NotNull;

public record BorrowRequest(@NotNull Long studentId, @NotNull Long bookId) {}
