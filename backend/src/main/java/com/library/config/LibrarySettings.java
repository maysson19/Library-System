package com.library.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

// Library rules. Change them in application.properties, for example:
//   library.loan-days=21
//   library.max-active-loans=5
@Component
@ConfigurationProperties(prefix = "library")
@Getter @Setter
public class LibrarySettings {
    private int loanDays = 14;
    private int maxActiveLoans = 3;
    private int renewDays = 7;
    private int maxRenewals = 1;
    private int maxLoginAttempts = 5;
    private int lockMinutes = 5;
}
