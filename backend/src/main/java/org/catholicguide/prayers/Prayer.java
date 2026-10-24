package org.catholicguide.prayers;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapKey;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import org.catholicguide.categories.Category;
import org.catholicguide.users.User;

/** A prayer and its shared details; the words live in one {@link PrayerTranslation} per language. */
@Entity
@Table(name = "prayers")
public class Prayer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String slug;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(nullable = false)
    private String readingTime = "1 min";

    @Column(nullable = false)
    private String tags = "";

    @Column(nullable = false)
    private String source = "";

    @OneToMany(mappedBy = "prayer", cascade = CascadeType.ALL, orphanRemoval = true)
    @MapKey(name = "lang")
    private Map<String, PrayerTranslation> translations = new HashMap<>();

    @Column(nullable = false)
    private Instant updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private User updatedBy;

    protected Prayer() {}

    Prayer(String slug, Category category) {
        this.slug = slug;
        this.category = category;
    }

    public Long getId() { return id; }
    public String getSlug() { return slug; }
    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }
    public String getReadingTime() { return readingTime; }
    public void setReadingTime(String readingTime) { this.readingTime = readingTime; }
    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public Map<String, PrayerTranslation> getTranslations() { return translations; }
    public Instant getUpdatedAt() { return updatedAt; }
    public User getUpdatedBy() { return updatedBy; }

    void touch(User by, Instant at) {
        updatedBy = by;
        updatedAt = at;
    }

    /** The English working title, used to name the prayer in the portal and the activity log. */
    public String displayTitle() {
        PrayerTranslation en = translations.get("en");
        if (en != null) {
            return en.getTitle();
        }
        return translations.values().stream().map(PrayerTranslation::getTitle).findFirst().orElse(slug);
    }
}
