package com.library.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

// A student asks to borrow (or return) a book, and the librarian approves or rejects it
@Entity
@Table(name = "loan_requests")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LoanRequest {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestStatus status;

    @ManyToOne(optional = false)
    @JoinColumn(name = "student_id")
    private Student student;

    @ManyToOne(optional = false)
    @JoinColumn(name = "book_id")
    private Book book;

    // RETURN request: the loan to return. BORROW request: the loan created when it is approved.
    @ManyToOne
    @JoinColumn(name = "loan_id")
    private Loan loan;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "decided_at")
    private LocalDateTime decidedAt;

    @Column(name = "decided_by", length = 50)
    private String decidedBy;

    // The librarian note (approval) or the reason (rejection) shown to the student
    @Column(length = 500)
    private String reason;

    // false = the student has an unread notification about the decision
    @Column(name = "student_seen", nullable = false)
    private boolean studentSeen;
}
