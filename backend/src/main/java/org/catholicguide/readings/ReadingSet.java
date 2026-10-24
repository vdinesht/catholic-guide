package org.catholicguide.readings;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.catholicguide.common.ContentStatus;
import org.catholicguide.users.User;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/** The readings for one day in one language: an editable working copy plus the published snapshot. */
@Entity
@Table(name = "reading_sets")
public class ReadingSet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate day;

    @Column(nullable = false)
    private String lang;

    @Column(nullable = false)
    private String credit = "";

    @Column(nullable = false)
    private String quote = "";

    @Column(nullable = false)
    private String quoteCite = "";

    @OneToMany(mappedBy = "readingSet", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("position")
    private List<ReadingPart> parts = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    private ReadingSnapshot published;

    private Instant publishedAt;

    private boolean hasChanges;

    @Column(nullable = false)
    private Instant updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private User updatedBy;

    protected ReadingSet() {}

    ReadingSet(LocalDate day, String lang) {
        this.day = day;
        this.lang = lang;
    }

    public Long getId() { return id; }
    public LocalDate getDay() { return day; }
    public String getLang() { return lang; }
    public String getCredit() { return credit; }
    public String getQuote() { return quote; }
    public String getQuoteCite() { return quoteCite; }
    public ReadingSnapshot getPublished() { return published; }
    public Instant getUpdatedAt() { return updatedAt; }
    public User getUpdatedBy() { return updatedBy; }

    public ContentStatus status() {
        return ContentStatus.of(true, publishedAt, hasChanges);
    }

    public ReadingSnapshot working() {
        return new ReadingSnapshot(credit, quote, quoteCite, parts.stream().map(ReadingPart::toSnapshot).toList());
    }

    void edit(ReadingSnapshot w, User by, Instant at) {
        this.credit = w.credit() == null ? "" : w.credit().strip();
        this.quote = w.quote() == null ? "" : w.quote().strip();
        this.quoteCite = w.quoteCite() == null ? "" : w.quoteCite().strip();
        parts.clear();
        for (int i = 0; i < w.parts().size(); i++) {
            parts.add(new ReadingPart(this, i, w.parts().get(i)));
        }
        touch(by, at);
        if (publishedAt != null) {
            hasChanges = !working().equals(published);
        }
    }

    void publish(User by, Instant at) {
        published = working();
        publishedAt = at;
        hasChanges = false;
        touch(by, at);
    }

    void unpublish(User by, Instant at) {
        published = null;
        publishedAt = null;
        hasChanges = false;
        touch(by, at);
    }

    private void touch(User by, Instant at) {
        updatedBy = by;
        updatedAt = at;
    }
}
