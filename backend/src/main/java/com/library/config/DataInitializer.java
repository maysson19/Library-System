package com.library.config;

import com.library.dto.CreatedAccountResponse;
import com.library.model.Book;
import com.library.model.Role;
import com.library.model.Student;
import com.library.model.User;
import com.library.repository.BookRepository;
import com.library.repository.StudentRepository;
import com.library.repository.UserRepository;
import com.library.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

// Creates sample data on first run. Safe to run many times: it only adds what is missing.
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final BookRepository bookRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserService userService;

    @Override
    public void run(String... args) {
        if (studentRepository.count() == 0) {
            studentRepository.save(Student.builder().studentCode("S1001").fullName("Ahmed Ali")
                    .email("ahmed@example.com").phone("01000000001").build());
            studentRepository.save(Student.builder().studentCode("S1002").fullName("Sara Mohamed")
                    .email("sara@example.com").phone("01000000002").build());
            studentRepository.save(Student.builder().studentCode("S1003").fullName("Omar Hassan")
                    .email("omar@example.com").phone("01000000003").build());
        }

        if (bookRepository.count() == 0) {
            bookRepository.save(book("Clean Code", "Robert Martin", "9780132350884", "Programming", 3,
                    2008, "دليل عملي لكتابة كود نظيف وسهل الصيانة."));
            bookRepository.save(book("Effective Java", "Joshua Bloch", "9780134685991", "Programming", 2,
                    2018, "أفضل الممارسات لكتابة برامج جافا قوية."));
            bookRepository.save(book("Database System Concepts", "Silberschatz", "9780078022159", "Databases", 2,
                    2019, "المرجع الأشهر في مفاهيم قواعد البيانات."));
            bookRepository.save(book("Software Engineering", "Ian Sommerville", "9780133943030", "Software Engineering", 1,
                    2015, "أساسيات هندسة البرمجيات ودورة حياة المشروع."));
            bookRepository.save(book("Angular in Action", "Jeremy Wilken", "9781617293313", "Web", 2,
                    2018, "تعلّم بناء تطبيقات الويب باستخدام Angular."));
        }

        ensureUser("admin", "admin123", "System Admin", Role.ADMIN, null);
        ensureUser("librarian", "lib123", "Library Staff", Role.LIBRARIAN, null);

        // student1 stays the account of the first student (S1001)
        Student first = studentRepository.findByStudentCode("S1001").orElse(null);
        if (first != null && !userRepository.existsByStudentId(first.getId())) {
            ensureUser("student1", UserService.DEFAULT_STUDENT_PASSWORD, first.getFullName(), Role.STUDENT, first);
        }

        // every other student gets an account too (username = student code, default password)
        for (CreatedAccountResponse a : userService.createMissingStudentAccounts()) {
            System.out.println(">>> Student account created: " + a.username() + " / " + a.password() + "  (" + a.studentName() + ")");
        }
    }

    private void ensureUser(String username, String rawPassword, String fullName, Role role, Student student) {
        if (userRepository.existsByUsername(username)) return;
        userRepository.save(User.builder()
                .username(username).password(passwordEncoder.encode(rawPassword))
                .fullName(fullName).role(role).student(student).build());
        System.out.println(">>> Default user created: " + username + " / " + rawPassword);
    }

    private Book book(String title, String author, String isbn, String category, int copies, int year, String description) {
        return Book.builder().title(title).author(author).isbn(isbn).category(category)
                .totalCopies(copies).availableCopies(copies).publishYear(year).description(description).build();
    }
}
