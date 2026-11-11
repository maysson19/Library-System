package com.library.controller;

import com.library.dto.CountResponse;
import com.library.dto.DecisionRequest;
import com.library.dto.LoanRequestResponse;
import com.library.service.LoanRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Librarian side: see the student requests and approve or reject them
@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
public class LoanRequestController {

    private final LoanRequestService requestService;

    @GetMapping("/pending")
    public List<LoanRequestResponse> pending() { return requestService.listPending(); }

    @GetMapping("/pending/count")
    public CountResponse pendingCount() { return new CountResponse(requestService.pendingCount()); }

    @GetMapping("/history")
    public List<LoanRequestResponse> history() { return requestService.listDecided(); }

    @PostMapping("/{id}/approve")
    public LoanRequestResponse approve(@PathVariable Long id,
                                       @RequestBody(required = false) DecisionRequest body,
                                       Authentication authentication) {
        return requestService.approve(id, authentication.getName(), body == null ? null : body.reason());
    }

    @PostMapping("/{id}/reject")
    public LoanRequestResponse reject(@PathVariable Long id,
                                      @RequestBody(required = false) DecisionRequest body,
                                      Authentication authentication) {
        return requestService.reject(id, authentication.getName(), body == null ? null : body.reason());
    }
}
