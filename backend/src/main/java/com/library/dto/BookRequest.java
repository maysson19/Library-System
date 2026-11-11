package com.library.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record BookRequest(
        @NotBlank String title,
        @NotBlank String author,
        @NotBlank String isbn,
        String category,
        @Min(1) int totalCopies,
        Integer publishYear,
        String description,
        String coverUrl) {}
