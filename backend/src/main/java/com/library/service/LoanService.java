package com.library.service;

import com.library.config.LibrarySettings;
import com.library.dto.BorrowRequest;
import com.library.dto.LoanResponse;
import com.library.dto.SummaryResponse;
import com.library.exception.BusinessException;
import com.library.exception.ResourceNotFoundException;
import com.library.model.Book;
import com.library.model.Loan;
import com.library.model.LoanStatus;
import com.library.model.Student;
import com.library.repository.BookRepository;
import com.library.repository.LoanRepository;
import com.library.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LoanService {

    private final LoanRepository loanRepository;
    private final BookRepository bookRepository;
    private final StudentRepository studentRepository;
    private final LibrarySettings settings;

    @Transactional
    public LoanResponse borrow(BorrowRequest req, String issuedBy) {
        Student student = studentRepository.findById(req.studentId())
                .orElseThrow(() -> new ResourceNotFoundException("student.notFound"));
        Book book = bookRepository.findByIdForUpdate(req.bookId())
                .orElseThrow(() -> new ResourceNotFoundException("book.notFound"));

        LocalDate today = LocalDate.now();

        if (book.getAvailableCopies() <= 0) {
            throw new BusinessException("loan.noCopies");
        }
        if (loanRepository.existsByStudentIdAndStatusAndDueDateBefore(student.getId(), LoanStatus.BORROWED, today)) {
            throw new BusinessException("loan.studentOverdue");
        }
        if (loanRepository.countByStudentIdAndStatus(student.getId(), LoanStatus.BORROWED) >= settings.getMaxActiveLoans()) {
            throw new BusinessException("loan.maxLoans", settings.getMaxActiveLoans());
        }
        if (loanRepository.existsByStudentIdAndBookIdAndStatus(student.getId(), book.getId(), LoanStatus.BORROWED)) {
            throw new BusinessException("loan.alreadyBorrowed");
        }

        book.setAvailableCopies(book.getAvailableCopies() - 1);
        bookRepository.save(book);

        Loan loan = loanRepository.save(Loan.builder()
                .student(student).book(book)
                .borrowDate(today).dueDate(today.plusDays(settings.getLoanDays()))
                .status(LoanStatus.BORROWED)
                .issuedBy(issuedBy)
                .renewCount(0)
                .build());
        return toResponse(loan);
    }

    @Transactional
    public LoanResponse returnBook(Long loanId) {
        Loan loan = findLoan(loanId);
        if (loan.getStatus() == LoanStatus.RETURNED) {
            throw new BusinessException("loan.alreadyReturned");
        }
        Book book = bookRepository.findByIdForUpdate(loan.getBook().getId()).orElseThrow();
        book.setAvailableCopies(Math.min(book.getAvailableCopies() + 1, book.getTotalCopies()));
        bookRepository.save(book);

        loan.setReturnDate(LocalDate.now());
        loan.setStatus(LoanStatus.RETURNED);
        return toResponse(loanRepository.save(loan));
    }

    // Extends the due date once (or as many times as library.max-renewals allows)
    @Transactional
    public LoanResponse renew(Long loanId) {
        Loan loan = findLoan(loanId);
        if (loan.getStatus() == LoanStatus.RETURNED) {
            throw new BusinessException("loan.renewReturned");
        }
        if (loan.getDueDate().isBefore(LocalDate.now())) {
            throw new BusinessException("loan.renewOverdue");
        }
        int renews = renewCount(loan);
        if (renews >= settings.getMaxRenewals()) {
            throw new BusinessException("loan.renewMax", settings.getMaxRenewals());
        }
        loan.setDueDate(loan.getDueDate().plusDays(settings.getRenewDays()));
        loan.setRenewCount(renews + 1);
        return toResponse(loanRepository.save(loan));
    }

    @Transactional(readOnly = true)
    public List<LoanResponse> findAll() {
        return loanRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<LoanResponse> findByStudent(Long studentId) {
        return loanRepository.findByStudentIdOrderByBorrowDateDesc(studentId)
                .stream().map(this::toResponse).toList();
    }

    // Report: books currently borrowed
    @Transactional(readOnly = true)
    public List<LoanResponse> currentlyBorrowed() {
        return loanRepository.findByStatus(LoanStatus.BORROWED).stream().map(this::toResponse).toList();
    }

    // Report: overdue books
    @Transactional(readOnly = true)
    public List<LoanResponse> overdue() {
        return loanRepository.findByStatusAndDueDateBefore(LoanStatus.BORROWED, LocalDate.now())
                .stream().map(this::toResponse).toList();
    }

    // Report: loan history filtered by borrow date and status (BORROWED, RETURNED or OVERDUE)
    @Transactional(readOnly = true)
    public List<LoanResponse> search(LocalDate from, LocalDate to, String status) {
        return loanRepository.findAll().stream()
                .filter(l -> from == null || !l.getBorrowDate().isBefore(from))
                .filter(l -> to == null || !l.getBorrowDate().isAfter(to))
                .filter(l -> matchesStatus(l, status))
                .sorted(Comparator.comparing(Loan::getId).reversed())
                .map(this::toResponse)
                .toList();
    }

    // Numbers for the staff dashboard
    @Transactional(readOnly = true)
    public SummaryResponse summary() {
        return new SummaryResponse(
                bookRepository.count(),
                bookRepository.sumTotalCopies(),
                bookRepository.sumAvailableCopies(),
                studentRepository.count(),
                loanRepository.countByStatus(LoanStatus.BORROWED),
                loanRepository.countByStatusAndDueDateBefore(LoanStatus.BORROWED, LocalDate.now()));
    }

    private Loan findLoan(Long id) {
        return loanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("loan.notFound"));
    }

    private boolean matchesStatus(Loan l, String status) {
        if (status == null || status.isBlank()) return true;
        if ("OVERDUE".equalsIgnoreCase(status)) return isOverdue(l);
        return l.getStatus().name().equalsIgnoreCase(status);
    }

    private boolean isOverdue(Loan l) {
        return l.getStatus() == LoanStatus.BORROWED && l.getDueDate().isBefore(LocalDate.now());
    }

    private int renewCount(Loan l) {
        return l.getRenewCount() == null ? 0 : l.getRenewCount();
    }

    private LoanResponse toResponse(Loan l) {
        LocalDate today = LocalDate.now();
        boolean overdue = isOverdue(l);
        long days = overdue ? ChronoUnit.DAYS.between(l.getDueDate(), today) : 0;
        boolean canRenew = l.getStatus() == LoanStatus.BORROWED && !overdue
                && renewCount(l) < settings.getMaxRenewals();
        return new LoanResponse(
                l.getId(),
                l.getStudent().getId(), l.getStudent().getStudentCode(), l.getStudent().getFullName(),
                l.getBook().getId(), l.getBook().getTitle(), l.getBook().getIsbn(),
                l.getBorrowDate(), l.getDueDate(), l.getReturnDate(),
                l.getStatus().name(), overdue, days,
                l.getIssuedBy(), renewCount(l), canRenew);
    }
}
