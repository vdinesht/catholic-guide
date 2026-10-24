package org.catholicguide.songs;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
import java.util.ArrayList;
import java.util.List;
import org.catholicguide.categories.Category;
import org.catholicguide.common.ContentStatus;
import org.catholicguide.users.User;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/** A hymn in exactly one language. Songs are not translated; another language is another song. */
@Entity
@Table(name = "songs")
public class Song {

    public enum Rights { PUBLIC_DOMAIN, LICENSED, NEEDS_CHECKING }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(nullable = false)
    private String lang;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String author = "";

    @Column(nullable = false)
    private String tune = "";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Rights rights = Rights.NEEDS_CHECKING;

    @Column(nullable = false)
    private String licenceNumber = "";

    @OneToMany(mappedBy = "song", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("position")
    private List<SongBlock> blocks = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    private SongSnapshot published;

    private Instant publishedAt;

    private boolean hasChanges;

    @Column(nullable = false)
    private Instant updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private User updatedBy;

    protected Song() {}

    Song(String slug) {
        this.slug = slug;
    }

    public Long getId() { return id; }
    public String getSlug() { return slug; }
    public String getLang() { return lang; }
    public void setLang(String lang) { this.lang = lang; }
    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }
    public String getTitle() { return title; }
    public String getAuthor() { return author; }
    public String getTune() { return tune; }
    public Rights getRights() { return rights; }
    public void setRights(Rights rights) { this.rights = rights; }
    public String getLicenceNumber() { return licenceNumber; }
    public void setLicenceNumber(String licenceNumber) { this.licenceNumber = licenceNumber; }
    public SongSnapshot getPublished() { return published; }
    public Instant getUpdatedAt() { return updatedAt; }
    public User getUpdatedBy() { return updatedBy; }

    public ContentStatus status() {
        return ContentStatus.of(true, publishedAt, hasChanges);
    }

    public boolean isLive() {
        return publishedAt != null;
    }

    public SongSnapshot working() {
        return new SongSnapshot(title, author, tune, blocks.stream().map(SongBlock::toSnapshot).toList());
    }

    void edit(SongSnapshot w) {
        this.title = w.title().strip();
        this.author = w.author() == null ? "" : w.author().strip();
        this.tune = w.tune() == null ? "" : w.tune().strip();
        blocks.clear();
        for (int i = 0; i < w.blocks().size(); i++) {
            SongSnapshot.Block b = w.blocks().get(i);
            blocks.add(new SongBlock(this, i, b.type(), b.body() == null ? "" : b.body().strip()));
        }
        if (publishedAt != null) {
            hasChanges = !working().equals(published);
        }
    }

    void publish(Instant at) {
        published = working();
        publishedAt = at;
        hasChanges = false;
    }

    void unpublish() {
        published = null;
        publishedAt = null;
        hasChanges = false;
    }

    void touch(User by, Instant at) {
        updatedBy = by;
        updatedAt = at;
    }
}
