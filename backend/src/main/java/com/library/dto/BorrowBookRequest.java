package com.library.dto;

import jakarta.validation.constraints.NotNull;

public record BorrowBookRequest(@NotNull Long bookId) {}
