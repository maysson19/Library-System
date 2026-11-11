package com.library.dto;

// What the librarian needs to see before deciding on a request
public record StudentStanding(int activeLoans, int maxLoans, int overdueLoans, int availableCopies, boolean eligible) {}
