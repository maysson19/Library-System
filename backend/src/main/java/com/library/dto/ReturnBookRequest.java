package com.library.dto;

import jakarta.validation.constraints.NotNull;

public record ReturnBookRequest(@NotNull Long loanId) {}
