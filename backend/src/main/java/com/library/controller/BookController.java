package com.library.controller;

import com.library.dto.BookRequest;
import com.library.model.Book;
import com.library.service.BookService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
public class BookController {

    private final BookService bookService;

    // Any logged-in user (including students) can browse and search.
    // Example: GET /api/books?q=java
    @GetMapping
    public List<Book> search(@RequestParam(required = false) String q) { return bookService.findAll(q); }

    @GetMapping("/{id}")
    public Book one(@PathVariable Long id) { return bookService.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
    public Book create(@Valid @RequestBody BookRequest r) { return bookService.create(r); }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
    public Book update(@PathVariable Long id, @Valid @RequestBody BookRequest r) {
        return bookService.update(id, r);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) { bookService.delete(id); }
}
