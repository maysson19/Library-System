package com.library.controller;

import com.library.dto.LoanResponse;
import com.library.dto.SummaryResponse;
import com.library.service.LoanService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
public class ReportController {

    private final LoanService loanService;

    @GetMapping("/summary")
    public SummaryResponse summary() { return loanService.summary(); }

    @GetMapping("/borrowed")
    public List<LoanResponse> borrowed() { return loanService.currentlyBorrowed(); }

    @GetMapping("/overdue")
    public List<LoanResponse> overdue() { return loanService.overdue(); }

    // Example: /api/reports/loans?from=2026-10-01&to=2026-10-31&status=OVERDUE
    @GetMapping("/loans")
    public List<LoanResponse> loans(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String status) {
        return loanService.search(from, to, status);
    }
}
