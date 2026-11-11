package com.library.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Table(name = "books")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Book {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, length = 200)
    private String title;

    @NotBlank
    @Column(nullable = false, length = 100)
    private String author;

    @NotBlank
    @Column(nullable = false, unique = true, length = 20)
    private String isbn;

    @Column(length = 50)
    private String category;

    @Min(1)
    @Column(name = "total_copies", nullable = false)
    private int totalCopies;

    @Column(name = "available_copies", nullable = false)
    private int availableCopies;

    @Column(name = "publish_year")
    private Integer publishYear;

    @Column(length = 1000)
    private String description;

    @Column(name = "cover_url", length = 500)
    private String coverUrl;
}
