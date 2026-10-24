package org.catholicguide.auth;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import org.catholicguide.users.User;

@Entity
@Table(name = "login_codes")
public class LoginCode {

    static final int MAX_ATTEMPTS = 5;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private String codeHash;

    @Column(nullable = false)
    private Instant expiresAt;

    private int attempts;

    private boolean used;

    @Column(nullable = false)
    private Instant createdAt;

    protected LoginCode() {}

    LoginCode(User user, String codeHash, Instant createdAt, Instant expiresAt) {
        this.user = user;
        this.codeHash = codeHash;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
    }

    public User getUser() { return user; }
    public String getCodeHash() { return codeHash; }
    public Instant getCreatedAt() { return createdAt; }

    boolean isUsable(Instant now) {
        return !used && attempts < MAX_ATTEMPTS && now.isBefore(expiresAt);
    }

    void recordFailedAttempt() {
        attempts++;
    }

    void markUsed() {
        used = true;
    }
}
