package com.library.repository;

import com.library.model.Book;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BookRepository extends JpaRepository<Book, Long> {
    boolean existsByIsbn(String isbn);

    @Query("SELECT b FROM Book b WHERE LOWER(b.title) LIKE LOWER(CONCAT('%', :q, '%')) " +
           "OR LOWER(b.author) LIKE LOWER(CONCAT('%', :q, '%')) " +
           "OR LOWER(b.category) LIKE LOWER(CONCAT('%', :q, '%')) " +
           "OR LOWER(b.isbn) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<Book> search(@Param("q") String q);

    // Locks the row so two librarians cannot borrow the last copy at the same time
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Book b WHERE b.id = :id")
    Optional<Book> findByIdForUpdate(@Param("id") Long id);

    @Query("SELECT COALESCE(SUM(b.totalCopies), 0) FROM Book b")
    Long sumTotalCopies();

    @Query("SELECT COALESCE(SUM(b.availableCopies), 0) FROM Book b")
    Long sumAvailableCopies();
}
