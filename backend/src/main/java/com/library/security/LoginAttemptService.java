package com.library.security;

import com.library.config.LibrarySettings;
import com.library.exception.TooManyAttemptsException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

// Locks a username for a few minutes after too many wrong passwords (kept in memory)
@Service
@RequiredArgsConstructor
public class LoginAttemptService {

    private record State(int failures, Instant lockedUntil) {}

    private final LibrarySettings settings;
    private final Map<String, State> states = new ConcurrentHashMap<>();

    public void checkNotLocked(String username) {
        State s = states.get(key(username));
        if (s != null && s.lockedUntil() != null && Instant.now().isBefore(s.lockedUntil())) {
            long minutes = Duration.between(Instant.now(), s.lockedUntil()).toMinutes() + 1;
            throw new TooManyAttemptsException("err.tooManyAttempts", minutes);
        }
    }

    public void recordFailure(String username) {
        states.compute(key(username), (k, old) -> {
            int failures = (old == null || isExpired(old)) ? 1 : old.failures() + 1;
            Instant lock = failures >= settings.getMaxLoginAttempts()
                    ? Instant.now().plus(Duration.ofMinutes(settings.getLockMinutes()))
                    : null;
            return new State(failures, lock);
        });
    }

    public void reset(String username) {
        states.remove(key(username));
    }

    private boolean isExpired(State s) {
        return s.lockedUntil() != null && Instant.now().isAfter(s.lockedUntil());
    }

    private String key(String username) {
        return username == null ? "" : username.toLowerCase();
    }
}
