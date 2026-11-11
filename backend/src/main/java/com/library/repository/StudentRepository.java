package com.library.repository;

import com.library.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {
    boolean existsByStudentCode(String studentCode);
    Optional<Student> findByStudentCode(String studentCode);
}
