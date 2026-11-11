package com.library.service;

import com.library.dto.BookRequest;
import com.library.exception.BusinessException;
import com.library.exception.ResourceNotFoundException;
import com.library.model.Book;
import com.library.repository.BookRepository;
import com.library.repository.LoanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BookService {

    private final BookRepository bookRepository;
    private final LoanRepository loanRepository;

    // Search by title, author, category or ISBN. Empty query returns all books.
    public List<Book> findAll(String q) {
        if (q == null || q.isBlank()) return bookRepository.findAll();
        return bookRepository.search(q.trim());
    }

    public Book get(Long id) {
        return bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("book.notFound"));
    }

    @Transactional
    public Book create(BookRequest r) {
        if (bookRepository.existsByIsbn(r.isbn())) {
            throw new BusinessException("book.isbnExists");
        }
        return bookRepository.save(Book.builder()
                .title(r.title()).author(r.author()).isbn(r.isbn()).category(blankToNull(r.category()))
                .totalCopies(r.totalCopies()).availableCopies(r.totalCopies())
                .publishYear(r.publishYear())
                .description(blankToNull(r.description()))
                .coverUrl(blankToNull(r.coverUrl()))
                .build());
    }

    @Transactional
    public Book update(Long id, BookRequest r) {
        Book b = get(id);
        if (!b.getIsbn().equals(r.isbn()) && bookRepository.existsByIsbn(r.isbn())) {
            throw new BusinessException("book.isbnExists");
        }
        int borrowed = b.getTotalCopies() - b.getAvailableCopies();
        if (r.totalCopies() < borrowed) {
            throw new BusinessException("book.copiesBelowBorrowed", borrowed);
        }
        b.setTitle(r.title());
        b.setAuthor(r.author());
        b.setIsbn(r.isbn());
        b.setCategory(blankToNull(r.category()));
        b.setTotalCopies(r.totalCopies());
        b.setAvailableCopies(r.totalCopies() - borrowed);
        b.setPublishYear(r.publishYear());
        b.setDescription(blankToNull(r.description()));
        b.setCoverUrl(blankToNull(r.coverUrl()));
        return bookRepository.save(b);
    }

    @Transactional
    public void delete(Long id) {
        Book b = get(id);
        if (loanRepository.existsByBookId(id)) {
            throw new BusinessException("book.hasLoans");
        }
        bookRepository.delete(b);
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }
}
