package com.library.service;

import com.library.config.LibrarySettings;
import com.library.dto.BorrowRequest;
import com.library.dto.LoanRequestResponse;
import com.library.dto.LoanResponse;
import com.library.exception.BusinessException;
import com.library.model.Book;
import com.library.model.LoanRequest;
import com.library.model.RequestStatus;
import com.library.model.RequestType;
import com.library.model.Role;
import com.library.model.Student;
import com.library.model.User;
import com.library.repository.BookRepository;
import com.library.repository.LoanRepository;
import com.library.repository.LoanRequestRepository;
import com.library.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

// Tests for the request flow: student asks, librarian approves or rejects with a reason
@ExtendWith(MockitoExtension.class)
class LoanRequestServiceTest {

    @Mock LoanRequestRepository requestRepository;
    @Mock LoanRepository loanRepository;
    @Mock BookRepository bookRepository;
    @Mock UserRepository userRepository;
    @Mock LoanService loanService;

    LoanRequestService service;
    Student student;
    Book book;

    @BeforeEach
    void setUp() {
        service = new LoanRequestService(requestRepository, loanRepository, bookRepository,
                userRepository, loanService, new LibrarySettings());
        student = Student.builder().id(1L).studentCode("S1").fullName("Test Student").build();
        book = Book.builder().id(10L).title("Test Book").author("A").isbn("111")
                .totalCopies(2).availableCopies(2).build();
    }

    private LoanRequest pendingBorrow() {
        return LoanRequest.builder().id(7L).type(RequestType.BORROW).status(RequestStatus.PENDING)
                .student(student).book(book).createdAt(LocalDateTime.now()).studentSeen(true).build();
    }

    private void studentAccountExists() {
        User user = User.builder().id(3L).username("stu").role(Role.STUDENT).student(student).build();
        when(userRepository.findByUsername("stu")).thenReturn(Optional.of(user));
    }

    // ---------- student creates requests ----------

    @Test
    void createBorrow_savesPendingRequest() {
        studentAccountExists();
        when(bookRepository.findById(10L)).thenReturn(Optional.of(book));
        when(requestRepository.save(any(LoanRequest.class))).thenAnswer(inv -> inv.getArgument(0));

        LoanRequestResponse res = service.createBorrow("stu", 10L);

        assertEquals("PENDING", res.status());
        assertEquals("BORROW", res.type());
        assertFalse(res.unread());
    }

    @Test
    void createBorrow_fails_whenNoCopies() {
        studentAccountExists();
        book.setAvailableCopies(0);
        when(bookRepository.findById(10L)).thenReturn(Optional.of(book));

        assertThrows(BusinessException.class, () -> service.createBorrow("stu", 10L));
        verify(requestRepository, never()).save(any(LoanRequest.class));
    }

    @Test
    void createBorrow_fails_whenSamePendingRequestExists() {
        studentAccountExists();
        when(bookRepository.findById(10L)).thenReturn(Optional.of(book));
        when(requestRepository.existsByStudentIdAndBookIdAndTypeAndStatus(
                1L, 10L, RequestType.BORROW, RequestStatus.PENDING)).thenReturn(true);

        assertThrows(BusinessException.class, () -> service.createBorrow("stu", 10L));
        verify(requestRepository, never()).save(any(LoanRequest.class));
    }

    // ---------- librarian decisions ----------

    @Test
    void approveBorrow_createsTheLoan_andNotifiesStudent() {
        LoanRequest r = pendingBorrow();
        when(requestRepository.findById(7L)).thenReturn(Optional.of(r));
        when(loanService.borrow(any(BorrowRequest.class), eq("lib"))).thenReturn(
                new LoanResponse(5L, 1L, "S1", "Test Student", 10L, "Test Book", "111",
                        LocalDate.now(), LocalDate.now().plusDays(14), null, "BORROWED", false, 0, "lib", 0, true));
        when(requestRepository.save(any(LoanRequest.class))).thenAnswer(inv -> inv.getArgument(0));

        LoanRequestResponse res = service.approve(7L, "lib", "Welcome");

        verify(loanService).borrow(new BorrowRequest(1L, 10L), "lib");
        assertEquals("APPROVED", res.status());
        assertEquals("Welcome", res.reason());
        assertEquals("lib", res.decidedBy());
        assertTrue(res.unread());
    }

    @Test
    void reject_requiresAReason() {
        LoanRequest r = pendingBorrow();
        when(requestRepository.findById(7L)).thenReturn(Optional.of(r));

        assertThrows(BusinessException.class, () -> service.reject(7L, "lib", "   "));
        verify(requestRepository, never()).save(any(LoanRequest.class));
    }

    @Test
    void reject_savesReason_andNotifiesStudent() {
        LoanRequest r = pendingBorrow();
        when(requestRepository.findById(7L)).thenReturn(Optional.of(r));
        when(requestRepository.save(any(LoanRequest.class))).thenAnswer(inv -> inv.getArgument(0));

        LoanRequestResponse res = service.reject(7L, "lib", "You have an overdue book");

        assertEquals("REJECTED", res.status());
        assertEquals("You have an overdue book", res.reason());
        assertTrue(res.unread());
        verify(loanService, never()).borrow(any(BorrowRequest.class), any(String.class));
    }

    @Test
    void approve_fails_whenAlreadyDecided() {
        LoanRequest r = pendingBorrow();
        r.setStatus(RequestStatus.REJECTED);
        when(requestRepository.findById(7L)).thenReturn(Optional.of(r));

        assertThrows(BusinessException.class, () -> service.approve(7L, "lib", null));
        verify(loanService, never()).borrow(any(BorrowRequest.class), any(String.class));
    }
}
