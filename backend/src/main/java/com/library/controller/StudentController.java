package com.library.controller;

import com.library.dto.StudentRequest;
import com.library.model.Student;
import com.library.service.LoanService;
import com.library.service.StudentService;
import com.library.dto.LoanResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
public class StudentController {

    private final StudentService studentService;
    private final LoanService loanService;

    @GetMapping
    public List<Student> all() { return studentService.findAll(); }

    @GetMapping("/{id}")
    public Student one(@PathVariable Long id) { return studentService.get(id); }

    // Loan history of one student
    @GetMapping("/{id}/loans")
    public List<LoanResponse> loans(@PathVariable Long id) { return loanService.findByStudent(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Student create(@Valid @RequestBody StudentRequest r) { return studentService.create(r); }

    @PutMapping("/{id}")
    public Student update(@PathVariable Long id, @Valid @RequestBody StudentRequest r) {
        return studentService.update(id, r);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) { studentService.delete(id); }
}
