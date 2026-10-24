package org.catholicguide.auth;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Optional;
import org.catholicguide.common.ApiException;
import org.catholicguide.settings.SettingsService;
import org.catholicguide.users.User;
import org.catholicguide.users.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Passwordless sign-in: a 6-digit code is emailed, and a correct code opens a session.
 * Requests for unknown or blocked addresses look exactly like successful ones,
 * so the form never reveals who has portal access.
 */
@Service
public class AuthService {

    static final Duration RESEND_COOLDOWN = Duration.ofSeconds(30);

    private final UserRepository users;
    private final LoginCodeRepository codes;
    private final SessionRepository sessions;
    private final SettingsService settings;
    private final MailService mail;
    private final Clock clock;

    public AuthService(UserRepository users, LoginCodeRepository codes, SessionRepository sessions,
                       SettingsService settings, MailService mail, Clock clock) {
        this.users = users;
        this.codes = codes;
        this.sessions = sessions;
        this.settings = settings;
        this.mail = mail;
        this.clock = clock;
    }

    public record IssuedSession(String token, User user, Duration lifetime) {}

    @Transactional
    public void requestCode(String rawEmail) {
        String email = normalise(rawEmail);
        SettingsService.SignInSettings rules = settings.signIn();
        Optional<User> found = users.findByEmailIgnoreCase(email);
        if (found.isEmpty() || !found.get().canSignIn() || !rules.allows(email)) {
            return;
        }
        User user = found.get();
        Instant now = clock.instant();
        Optional<LoginCode> last = codes.findFirstByUserOrderByCreatedAtDesc(user);
        if (last.isPresent() && last.get().getCreatedAt().plus(RESEND_COOLDOWN).isAfter(now)) {
            return;
        }
        String code = Hashing.sixDigitCode();
        Instant expires = now.plus(Duration.ofMinutes(rules.codeExpiryMinutes()));
        codes.save(new LoginCode(user, Hashing.sha256(code), now, expires));
        mail.sendSignInCode(user.getEmail(), code, rules.codeExpiryMinutes());
    }

    @Transactional(noRollbackFor = ApiException.class)
    public IssuedSession verify(String rawEmail, String code) {
        String email = normalise(rawEmail);
        ApiException wrong = new ApiException(HttpStatus.UNAUTHORIZED,
                "That code didn't work. Check the latest email, or ask for a new code.");
        if (code == null || !code.matches("\\d{6}")) {
            throw ApiException.badRequest("Enter all 6 digits from the email.");
        }
        User user = users.findByEmailIgnoreCase(email).filter(User::canSignIn).orElseThrow(() -> wrong);
        Instant now = clock.instant();
        LoginCode latest = codes.findFirstByUserOrderByCreatedAtDesc(user)
                .filter(c -> c.isUsable(now))
                .orElseThrow(() -> wrong);
        if (!Hashing.constantTimeEquals(latest.getCodeHash(), Hashing.sha256(code))) {
            latest.recordFailedAttempt();
            throw wrong;
        }
        latest.markUsed();
        if (user.getStatus() == User.Status.INVITED) {
            user.setStatus(User.Status.ACTIVE);
        }
        user.setLastSignInAt(now);

        Duration lifetime = Duration.ofDays(settings.signIn().sessionDays());
        String token = Hashing.sessionToken();
        sessions.save(new Session(Hashing.sha256(token), user, now, now.plus(lifetime)));
        sessions.deleteExpired(now);
        return new IssuedSession(token, user, lifetime);
    }

    @Transactional(readOnly = true)
    public Optional<User> userForToken(String token) {
        Instant now = clock.instant();
        return sessions.findById(Hashing.sha256(token))
                .filter(s -> s.getExpiresAt().isAfter(now))
                .map(Session::getUser)
                .filter(User::canSignIn);
    }

    @Transactional
    public void signOut(String token) {
        sessions.deleteById(Hashing.sha256(token));
    }

    private static String normalise(String email) {
        if (email == null || !email.trim().matches("[^@\\s]+@[^@\\s]+\\.[^@\\s]+")) {
            throw ApiException.badRequest("Enter a valid email address.");
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
