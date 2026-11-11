package com.library.controller;

import com.library.config.LibrarySettings;
import com.library.dto.SettingsResponse;
import com.library.model.Book;
import com.library.repository.BookRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// Endpoints that anyone can call without logging in (used by the public pages)
@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicController {

    private final BookRepository bookRepository;
    private final LibrarySettings settings;

    @GetMapping("/books")
    public List<Book> books() {
        return bookRepository.findAll(Sort.by(Sort.Direction.DESC, "id"));
    }

    // Library rules, so the website always shows the same numbers as the backend
    @GetMapping("/settings")
    public SettingsResponse settings() {
        return new SettingsResponse(settings.getLoanDays(), settings.getMaxActiveLoans(),
                settings.getRenewDays(), settings.getMaxRenewals());
    }
}
