package com.library.service;

import com.library.config.LibrarySettings;
import com.library.dto.BorrowRequest;
import com.library.dto.LoanRequestResponse;
import com.library.dto.LoanResponse;
import com.library.dto.StudentStanding;
import com.library.exception.BusinessException;
import com.library.exception.ResourceNotFoundException;
import com.library.model.Book;
import com.library.model.Loan;
import com.library.model.LoanRequest;
import com.library.model.LoanStatus;
import com.library.model.RequestStatus;
import com.library.model.RequestType;
import com.library.model.Student;
import com.library.model.User;
import com.library.repository.BookRepository;
import com.library.repository.LoanRepository;
import com.library.repository.LoanRequestRepository;
import com.library.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

// Student requests (borrow / return) and the librarian decisions
@Service
@RequiredArgsConstructor
public class LoanRequestService {

    private final LoanRequestRepository requestRepository;
    private final LoanRepository loanRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final LoanService loanService;
    private final LibrarySettings settings;

    // ---------------------------------------------------------------- student side

    @Transactional
    public LoanRequestResponse createBorrow(String username, Long bookId) {
        Student student = studentOf(username);
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("book.notFound"));
        if (book.getAvailableCopies() <= 0) {
            throw new BusinessException("loan.noCopies");
        }
        if (loanRepository.existsByStudentIdAndBookIdAndStatus(student.getId(), bookId, LoanStatus.BORROWED)) {
            throw new BusinessException("loan.alreadyBorrowed");
        }
        if (requestRepository.existsByStudentIdAndBookIdAndTypeAndStatus(
                student.getId(), bookId, RequestType.BORROW, RequestStatus.PENDING)) {
            throw new BusinessException("request.duplicate");
        }
        LoanRequest saved = requestRepository.save(LoanRequest.builder()
                .type(RequestType.BORROW).status(RequestStatus.PENDING)
                .student(student).book(book)
                .createdAt(LocalDateTime.now())
                .studentSeen(true)
                .build());
        return toResponse(saved, false);
    }

    @Transactional
    public LoanRequestResponse createReturn(String username, Long loanId) {
        Student student = studentOf(username);
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("loan.notFound"));
        if (!loan.getStudent().getId().equals(student.getId())) {
            throw new BusinessException("request.notYourLoan");
        }
        if (loan.getStatus() == LoanStatus.RETURNED) {
            throw new BusinessException("loan.alreadyReturned");
        }
        if (requestRepository.existsByLoanIdAndTypeAndStatus(loanId, RequestType.RETURN, RequestStatus.PENDING)) {
            throw new BusinessException("request.duplicate");
        }
        LoanRequest saved = requestRepository.save(LoanRequest.builder()
                .type(RequestType.RETURN).status(RequestStatus.PENDING)
                .student(student).book(loan.getBook()).loan(loan)
                .createdAt(LocalDateTime.now())
                .studentSeen(true)
                .build());
        return toResponse(saved, false);
    }

    @Transactional(readOnly = true)
    public List<LoanRequestResponse> listMine(String username) {
        Student student = studentOf(username);
        return requestRepository.findByStudentIdOrderByCreatedAtDesc(student.getId())
                .stream().map(r -> toResponse(r, false)).toList();
    }

    @Transactional(readOnly = true)
    public long unreadCount(String username) {
        return requestRepository.countByStudentIdAndStudentSeenFalse(studentOf(username).getId());
    }

    @Transactional
    public void markAllSeen(String username) {
        List<LoanRequest> unread = requestRepository.findByStudentIdAndStudentSeenFalse(studentOf(username).getId());
        unread.forEach(r -> r.setStudentSeen(true));
        requestRepository.saveAll(unread);
    }

    // ---------------------------------------------------------------- librarian side

    @Transactional(readOnly = true)
    public List<LoanRequestResponse> listPending() {
        return requestRepository.findByStatusOrderByCreatedAtAsc(RequestStatus.PENDING)
                .stream().map(r -> toResponse(r, true)).toList();
    }

    @Transactional(readOnly = true)
    public List<LoanRequestResponse> listDecided() {
        return requestRepository.findByStatusNotOrderByDecidedAtDesc(RequestStatus.PENDING)
                .stream().limit(30).map(r -> toResponse(r, false)).toList();
    }

    @Transactional(readOnly = true)
    public long pendingCount() {
        return requestRepository.countByStatus(RequestStatus.PENDING);
    }

    // Approve: the loan rules (copies, overdue, maximum loans) are checked again by LoanService
    @Transactional
    public LoanRequestResponse approve(Long id, String staffUsername, String note) {
        LoanRequest r = find(id);
        requirePending(r);
        if (r.getType() == RequestType.BORROW) {
            LoanResponse created = loanService.borrow(
                    new BorrowRequest(r.getStudent().getId(), r.getBook().getId()), staffUsername);
            r.setLoan(loanRepository.getReferenceById(created.id()));
        } else {
            loanService.returnBook(r.getLoan().getId());
        }
        decide(r, RequestStatus.APPROVED, staffUsername, blankToNull(note));
        return toResponse(requestRepository.save(r), false);
    }

    @Transactional
    public LoanRequestResponse reject(Long id, String staffUsername, String reason) {
        LoanRequest r = find(id);
        requirePending(r);
        if (reason == null || reason.isBlank()) {
            throw new BusinessException("request.reasonRequired");
        }
        decide(r, RequestStatus.REJECTED, staffUsername, reason.trim());
        return toResponse(requestRepository.save(r), false);
    }

    // ---------------------------------------------------------------- helpers

    private void decide(LoanRequest r, RequestStatus status, String staff, String reason) {
        r.setStatus(status);
        r.setDecidedAt(LocalDateTime.now());
        r.setDecidedBy(staff);
        r.setReason(reason);
        r.setStudentSeen(false); // creates the notification for the student
    }

    private LoanRequest find(Long id) {
        return requestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("request.notFound"));
    }

    private void requirePending(LoanRequest r) {
        if (r.getStatus() != RequestStatus.PENDING) {
            throw new BusinessException("request.alreadyDecided");
        }
    }

    private Student studentOf(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("user.notFound"));
        if (user.getStudent() == null) {
            throw new BusinessException("me.notLinked");
        }
        return user.getStudent();
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }

    private StudentStanding standing(LoanRequest r) {
        Long studentId = r.getStudent().getId();
        int active = (int) loanRepository.countByStudentIdAndStatus(studentId, LoanStatus.BORROWED);
        int overdue = (int) loanRepository.countByStudentIdAndStatusAndDueDateBefore(
                studentId, LoanStatus.BORROWED, LocalDate.now());
        int max = settings.getMaxActiveLoans();
        int copies = r.getBook().getAvailableCopies();
        boolean eligible = r.getType() == RequestType.RETURN || (overdue == 0 && active < max && copies > 0);
        return new StudentStanding(active, max, overdue, copies, eligible);
    }

    private LoanRequestResponse toResponse(LoanRequest r, boolean withStanding) {
        return new LoanRequestResponse(
                r.getId(), r.getType().name(), r.getStatus().name(),
                r.getStudent().getId(), r.getStudent().getStudentCode(), r.getStudent().getFullName(),
                r.getBook().getId(), r.getBook().getTitle(), r.getBook().getIsbn(),
                r.getLoan() == null ? null : r.getLoan().getId(),
                r.getCreatedAt(), r.getDecidedAt(), r.getDecidedBy(),
                r.getReason(), !r.isStudentSeen(),
                withStanding ? standing(r) : null);
    }
}
