package com.library.dto;

public record SettingsResponse(int loanDays, int maxActiveLoans, int renewDays, int maxRenewals) {}
