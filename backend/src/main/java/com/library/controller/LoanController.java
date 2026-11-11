package com.library.controller;

import com.library.dto.BorrowRequest;
import com.library.dto.LoanResponse;
import com.library.service.LoanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/loans")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
public class LoanController {

    private final LoanService loanService;

    @GetMapping
    public List<LoanResponse> all() { return loanService.findAll(); }

    @PostMapping("/borrow")
    @ResponseStatus(HttpStatus.CREATED)
    public LoanResponse borrow(@Valid @RequestBody BorrowRequest request, Authentication authentication) {
        return loanService.borrow(request, authentication.getName());
    }

    @PostMapping("/{id}/return")
    public LoanResponse returnBook(@PathVariable Long id) { return loanService.returnBook(id); }

    @PostMapping("/{id}/renew")
    public LoanResponse renew(@PathVariable Long id) { return loanService.renew(id); }
}
