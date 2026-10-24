package org.catholicguide.activity;

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
@Table(name = "activity")
public class Activity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Instant at;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private String verb;

    @Column(nullable = false)
    private String item;

    protected Activity() {}

    Activity(Instant at, User user, String verb, String item) {
        this.at = at;
        this.user = user;
        this.verb = verb;
        this.item = item;
    }

    public Long getId() { return id; }
    public Instant getAt() { return at; }
    public User getUser() { return user; }
    public String getVerb() { return verb; }
    public String getItem() { return item; }
}
