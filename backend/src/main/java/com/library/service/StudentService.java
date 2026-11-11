package com.library.service;

import com.library.dto.StudentRequest;
import com.library.exception.BusinessException;
import com.library.exception.ResourceNotFoundException;
import com.library.model.Student;
import com.library.repository.LoanRepository;
import com.library.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;
    private final LoanRepository loanRepository;

    public List<Student> findAll() {
        return studentRepository.findAll();
    }

    public Student get(Long id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("student.notFound"));
    }

    @Transactional
    public Student create(StudentRequest r) {
        if (studentRepository.existsByStudentCode(r.studentCode())) {
            throw new BusinessException("student.codeExists");
        }
        return studentRepository.save(Student.builder()
                .studentCode(r.studentCode()).fullName(r.fullName())
                .email(r.email()).phone(r.phone()).build());
    }

    @Transactional
    public Student update(Long id, StudentRequest r) {
        Student s = get(id);
        if (!s.getStudentCode().equals(r.studentCode()) && studentRepository.existsByStudentCode(r.studentCode())) {
            throw new BusinessException("student.codeExists");
        }
        s.setStudentCode(r.studentCode());
        s.setFullName(r.fullName());
        s.setEmail(r.email());
        s.setPhone(r.phone());
        return studentRepository.save(s);
    }

    @Transactional
    public void delete(Long id) {
        Student s = get(id);
        if (loanRepository.existsByStudentId(id)) {
            throw new BusinessException("student.hasLoans");
        }
        studentRepository.delete(s);
    }
}
