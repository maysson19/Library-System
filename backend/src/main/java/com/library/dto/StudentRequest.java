package com.library.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record StudentRequest(
        @NotBlank String studentCode,
        @NotBlank String fullName,
        @Email String email,
        String phone) {}
