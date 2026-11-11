package com.library.service;

import com.library.dto.CreateUserRequest;
import com.library.dto.CreatedAccountResponse;
import com.library.dto.UserResponse;
import com.library.exception.BusinessException;
import com.library.exception.ResourceNotFoundException;
import com.library.model.Role;
import com.library.model.Student;
import com.library.model.User;
import com.library.repository.StudentRepository;
import com.library.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    public static final String DEFAULT_STUDENT_PASSWORD = "stu123";

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<UserResponse> findAll() {
        return userRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional
    public UserResponse create(CreateUserRequest r) {
        if (userRepository.existsByUsername(r.username())) {
            throw new BusinessException("user.exists");
        }
        Student student = null;
        if (r.role() == Role.STUDENT) {
            if (r.studentId() == null) {
                throw new BusinessException("user.pickStudent");
            }
            student = studentRepository.findById(r.studentId())
                    .orElseThrow(() -> new ResourceNotFoundException("student.notFound"));
            if (userRepository.existsByStudentId(student.getId())) {
                throw new BusinessException("user.studentHasAccount");
            }
        }
        User saved = userRepository.save(User.builder()
                .username(r.username())
                .password(passwordEncoder.encode(r.password()))
                .fullName(r.fullName())
                .role(r.role())
                .student(student)
                .build());
        return toResponse(saved);
    }

    // Admin sets a new password for any user
    @Transactional
    public void resetPassword(Long id, String newPassword) {
        User u = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("user.notFound"));
        u.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(u);
    }

    @Transactional
    public void delete(Long id, String currentUsername) {
        User u = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("user.notFound"));
        if (u.getUsername().equals(currentUsername)) {
            throw new BusinessException("user.deleteSelf");
        }
        if (u.getRole() == Role.ADMIN && userRepository.countByRole(Role.ADMIN) <= 1) {
            throw new BusinessException("user.deleteLastAdmin");
        }
        userRepository.delete(u);
    }

    // A logged-in user changes their own password
    @Transactional
    public void changeOwnPassword(String username, String oldPassword, String newPassword) {
        User u = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("user.notFound"));
        if (!passwordEncoder.matches(oldPassword, u.getPassword())) {
            throw new BusinessException("user.wrongOldPassword");
        }
        u.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(u);
    }

    // Gives every student that has no login a student account (username = student code, default password)
    @Transactional
    public List<CreatedAccountResponse> createMissingStudentAccounts() {
        List<CreatedAccountResponse> created = new ArrayList<>();
        for (Student s : studentRepository.findAll()) {
            if (userRepository.existsByStudentId(s.getId())) continue;
            String username = freeUsername(s.getStudentCode());
            userRepository.save(User.builder()
                    .username(username)
                    .password(passwordEncoder.encode(DEFAULT_STUDENT_PASSWORD))
                    .fullName(s.getFullName())
                    .role(Role.STUDENT)
                    .student(s)
                    .build());
            created.add(new CreatedAccountResponse(s.getFullName(), s.getStudentCode(), username, DEFAULT_STUDENT_PASSWORD));
        }
        return created;
    }

    private String freeUsername(String studentCode) {
        String base = studentCode.toLowerCase().replaceAll("[^a-z0-9]", "");
        if (base.length() < 3) base = "student" + base;
        String candidate = base;
        int n = 1;
        while (userRepository.existsByUsername(candidate)) {
            candidate = base + (++n);
        }
        return candidate;
    }

    public UserResponse toResponse(User u) {
        Student s = u.getStudent();
        return new UserResponse(u.getId(), u.getUsername(), u.getFullName(), u.getRole().name(),
                s == null ? null : s.getId(), s == null ? null : s.getFullName());
    }
}
