package org.catholicguide.users;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "users")
public class User {

    public enum Role { ADMIN, EDITOR }

    public enum Status { INVITED, ACTIVE, DEACTIVATED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    private Instant lastSignInAt;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected User() {}

    public User(String name, String email, Role role, Status status) {
        this.name = name;
        this.email = email;
        this.role = role;
        this.status = status;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public Instant getLastSignInAt() { return lastSignInAt; }
    public void setLastSignInAt(Instant lastSignInAt) { this.lastSignInAt = lastSignInAt; }
    public Instant getCreatedAt() { return createdAt; }

    public boolean isAdmin() {
        return role == Role.ADMIN;
    }

    public boolean canSignIn() {
        return status != Status.DEACTIVATED;
    }
}
