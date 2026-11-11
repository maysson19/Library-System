package com.library.repository;

import com.library.model.Loan;
import com.library.model.LoanStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface LoanRepository extends JpaRepository<Loan, Long> {
    List<Loan> findByStatus(LoanStatus status);
    List<Loan> findByStatusAndDueDateBefore(LoanStatus status, LocalDate date);
    List<Loan> findByStudentIdOrderByBorrowDateDesc(Long studentId);
    long countByStatus(LoanStatus status);
    long countByStatusAndDueDateBefore(LoanStatus status, LocalDate date);
    long countByStudentIdAndStatus(Long studentId, LoanStatus status);
    long countByStudentIdAndStatusAndDueDateBefore(Long studentId, LoanStatus status, LocalDate date);
    boolean existsByStudentIdAndStatusAndDueDateBefore(Long studentId, LoanStatus status, LocalDate date);
    boolean existsByStudentIdAndBookIdAndStatus(Long studentId, Long bookId, LoanStatus status);
    boolean existsByBookId(Long bookId);
    boolean existsByStudentId(Long studentId);
}
