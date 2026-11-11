package com.library.repository;

import com.library.model.Role;
import com.library.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    boolean existsByStudentId(Long studentId);
    long countByRole(Role role);
}
