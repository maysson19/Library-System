package com.library.service;

import com.library.config.LibrarySettings;
import com.library.dto.BorrowRequest;
import com.library.dto.LoanResponse;
import com.library.exception.BusinessException;
import com.library.model.Book;
import com.library.model.Loan;
import com.library.model.LoanStatus;
import com.library.model.Student;
import com.library.repository.BookRepository;
import com.library.repository.LoanRepository;
import com.library.repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

// Tests for the library rules: limit of loans, overdue block, copies, return and renew
@ExtendWith(MockitoExtension.class)
class LoanServiceTest {

    @Mock LoanRepository loanRepository;
    @Mock BookRepository bookRepository;
    @Mock StudentRepository studentRepository;

    LibrarySettings settings;
    LoanService service;
    Student student;
    Book book;

    @BeforeEach
    void setUp() {
        settings = new LibrarySettings(); // defaults: 14 days, 3 loans, renew +7 days once
        service = new LoanService(loanRepository, bookRepository, studentRepository, settings);
        student = Student.builder().id(1L).studentCode("S1").fullName("Test Student").build();
        book = Book.builder().id(10L).title("Test Book").author("Author").isbn("111")
                .totalCopies(2).availableCopies(2).build();
    }

    private void studentAndBookExist() {
        when(studentRepository.findById(1L)).thenReturn(Optional.of(student));
        when(bookRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(book));
    }

    private Loan activeLoan(LocalDate dueDate, Integer renewCount) {
        return Loan.builder().id(5L).student(student).book(book)
                .borrowDate(LocalDate.now().minusDays(5)).dueDate(dueDate)
                .status(LoanStatus.BORROWED).renewCount(renewCount).build();
    }

    // ---------- borrow ----------

    @Test
    void borrow_succeeds_andReducesCopies() {
        studentAndBookExist();
        when(loanRepository.save(any(Loan.class))).thenAnswer(inv -> inv.getArgument(0));

        LoanResponse res = service.borrow(new BorrowRequest(1L, 10L), "librarian");

        assertEquals(1, book.getAvailableCopies());
        assertEquals(LocalDate.now().plusDays(14), res.dueDate());
        assertEquals("BORROWED", res.status());
        assertEquals("librarian", res.issuedBy());
        verify(bookRepository).save(book);
    }

    @Test
    void borrow_fails_whenNoCopiesLeft() {
        book.setAvailableCopies(0);
        studentAndBookExist();

        assertThrows(BusinessException.class, () -> service.borrow(new BorrowRequest(1L, 10L), "librarian"));
        verify(loanRepository, never()).save(any(Loan.class));
    }

    @Test
    void borrow_fails_whenStudentHasOverdueBook() {
        studentAndBookExist();
        when(loanRepository.existsByStudentIdAndStatusAndDueDateBefore(
                eq(1L), eq(LoanStatus.BORROWED), any(LocalDate.class))).thenReturn(true);

        assertThrows(BusinessException.class, () -> service.borrow(new BorrowRequest(1L, 10L), "librarian"));
        verify(loanRepository, never()).save(any(Loan.class));
    }

    @Test
    void borrow_fails_whenStudentReachedMaximumLoans() {
        studentAndBookExist();
        when(loanRepository.countByStudentIdAndStatus(1L, LoanStatus.BORROWED)).thenReturn(3L);

        assertThrows(BusinessException.class, () -> service.borrow(new BorrowRequest(1L, 10L), "librarian"));
        verify(loanRepository, never()).save(any(Loan.class));
    }

    @Test
    void borrow_fails_whenSameBookAlreadyBorrowedByStudent() {
        studentAndBookExist();
        when(loanRepository.existsByStudentIdAndBookIdAndStatus(1L, 10L, LoanStatus.BORROWED)).thenReturn(true);

        assertThrows(BusinessException.class, () -> service.borrow(new BorrowRequest(1L, 10L), "librarian"));
        verify(loanRepository, never()).save(any(Loan.class));
    }

    // ---------- return ----------

    @Test
    void returnBook_succeeds_andRestoresCopy() {
        book.setAvailableCopies(1);
        Loan loan = activeLoan(LocalDate.now().plusDays(5), 0);
        when(loanRepository.findById(5L)).thenReturn(Optional.of(loan));
        when(bookRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(book));
        when(loanRepository.save(any(Loan.class))).thenAnswer(inv -> inv.getArgument(0));

        LoanResponse res = service.returnBook(5L);

        assertEquals(2, book.getAvailableCopies());
        assertEquals("RETURNED", res.status());
        assertEquals(LocalDate.now(), res.returnDate());
    }

    @Test
    void returnBook_fails_whenAlreadyReturned() {
        Loan loan = activeLoan(LocalDate.now().plusDays(5), 0);
        loan.setStatus(LoanStatus.RETURNED);
        when(loanRepository.findById(5L)).thenReturn(Optional.of(loan));

        assertThrows(BusinessException.class, () -> service.returnBook(5L));
    }

    // ---------- renew ----------

    @Test
    void renew_extendsDueDate() {
        LocalDate due = LocalDate.now().plusDays(3);
        Loan loan = activeLoan(due, 0);
        when(loanRepository.findById(5L)).thenReturn(Optional.of(loan));
        when(loanRepository.save(any(Loan.class))).thenAnswer(inv -> inv.getArgument(0));

        LoanResponse res = service.renew(5L);

        assertEquals(due.plusDays(7), res.dueDate());
        assertEquals(1, res.renewCount());
        assertEquals(false, res.canRenew());
    }

    @Test
    void renew_fails_whenOverdue() {
        Loan loan = activeLoan(LocalDate.now().minusDays(1), 0);
        when(loanRepository.findById(5L)).thenReturn(Optional.of(loan));

        assertThrows(BusinessException.class, () -> service.renew(5L));
    }

    @Test
    void renew_fails_whenRenewalLimitReached() {
        Loan loan = activeLoan(LocalDate.now().plusDays(3), 1);
        when(loanRepository.findById(5L)).thenReturn(Optional.of(loan));

        assertThrows(BusinessException.class, () -> service.renew(5L));
    }
}
