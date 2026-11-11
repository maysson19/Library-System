package com.library.repository;

import com.library.model.LoanRequest;
import com.library.model.RequestStatus;
import com.library.model.RequestType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LoanRequestRepository extends JpaRepository<LoanRequest, Long> {
    List<LoanRequest> findByStatusOrderByCreatedAtAsc(RequestStatus status);
    List<LoanRequest> findByStatusNotOrderByDecidedAtDesc(RequestStatus status);
    List<LoanRequest> findByStudentIdOrderByCreatedAtDesc(Long studentId);
    List<LoanRequest> findByStudentIdAndStudentSeenFalse(Long studentId);
    long countByStatus(RequestStatus status);
    long countByStudentIdAndStudentSeenFalse(Long studentId);
    boolean existsByStudentIdAndBookIdAndTypeAndStatus(Long studentId, Long bookId, RequestType type, RequestStatus status);
    boolean existsByLoanIdAndTypeAndStatus(Long loanId, RequestType type, RequestStatus status);
}
