package com.library.controller;

import com.library.dto.BorrowBookRequest;
import com.library.dto.CountResponse;
import com.library.dto.LoanRequestResponse;
import com.library.dto.LoanResponse;
import com.library.dto.ReturnBookRequest;
import com.library.exception.BusinessException;
import com.library.model.User;
import com.library.repository.UserRepository;
import com.library.service.LoanRequestService;
import com.library.service.LoanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Everything a logged-in student can do
@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STUDENT')")
public class MeController {

    private final UserRepository userRepository;
    private final LoanService loanService;
    private final LoanRequestService requestService;

    @GetMapping("/loans")
    public List<LoanResponse> myLoans(Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName()).orElseThrow();
        if (user.getStudent() == null) {
            throw new BusinessException("me.notLinked");
        }
        return loanService.findByStudent(user.getStudent().getId());
    }

    // My requests and the librarian answers (these are the notifications)
    @GetMapping("/requests")
    public List<LoanRequestResponse> myRequests(Authentication authentication) {
        return requestService.listMine(authentication.getName());
    }

    @PostMapping("/requests/borrow")
    @ResponseStatus(HttpStatus.CREATED)
    public LoanRequestResponse requestBorrow(@Valid @RequestBody BorrowBookRequest body, Authentication authentication) {
        return requestService.createBorrow(authentication.getName(), body.bookId());
    }

    @PostMapping("/requests/return")
    @ResponseStatus(HttpStatus.CREATED)
    public LoanRequestResponse requestReturn(@Valid @RequestBody ReturnBookRequest body, Authentication authentication) {
        return requestService.createReturn(authentication.getName(), body.loanId());
    }

    @GetMapping("/notifications/unread-count")
    public CountResponse unreadCount(Authentication authentication) {
        return new CountResponse(requestService.unreadCount(authentication.getName()));
    }

    @PostMapping("/notifications/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markRead(Authentication authentication) {
        requestService.markAllSeen(authentication.getName());
    }
}
