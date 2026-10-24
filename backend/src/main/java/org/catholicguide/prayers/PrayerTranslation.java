package org.catholicguide.prayers;

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
import org.catholicguide.common.ContentStatus;
import org.catholicguide.users.User;

@Entity
@Table(name = "prayer_translations")
public class PrayerTranslation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "prayer_id")
    private Prayer prayer;

    @Column(nullable = false)
    private String lang;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String body = "";

    private String publishedTitle;

    private String publishedBody;

    private Instant publishedAt;

    private boolean hasChanges;

    @Column(nullable = false)
    private Instant updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private User updatedBy;

    protected PrayerTranslation() {}

    PrayerTranslation(Prayer prayer, String lang) {
        this.prayer = prayer;
        this.lang = lang;
    }

    public String getLang() { return lang; }
    public String getTitle() { return title; }
    public String getBody() { return body; }
    public String getPublishedTitle() { return publishedTitle; }
    public String getPublishedBody() { return publishedBody; }
    public Instant getUpdatedAt() { return updatedAt; }
    public User getUpdatedBy() { return updatedBy; }

    public ContentStatus status() {
        return ContentStatus.of(true, publishedAt, hasChanges);
    }

    public boolean isLive() {
        return publishedAt != null;
    }

    void edit(String title, String body, User by, Instant at) {
        this.title = title.strip();
        this.body = body == null ? "" : body.strip();
        touch(by, at);
        if (publishedAt != null) {
            hasChanges = !this.title.equals(publishedTitle) || !this.body.equals(publishedBody);
        }
    }

    void publish(User by, Instant at) {
        publishedTitle = title;
        publishedBody = body;
        publishedAt = at;
        hasChanges = false;
        touch(by, at);
    }

    void unpublish(User by, Instant at) {
        publishedTitle = null;
        publishedBody = null;
        publishedAt = null;
        hasChanges = false;
        touch(by, at);
    }

    private void touch(User by, Instant at) {
        updatedBy = by;
        updatedAt = at;
    }
}
