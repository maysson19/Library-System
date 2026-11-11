package com.library.dto;

public record UserResponse(Long id, String username, String fullName, String role,
                           Long studentId, String studentName) {}
