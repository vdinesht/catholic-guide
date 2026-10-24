package org.catholicguide.prayers;

import java.time.Clock;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.catholicguide.activity.ActivityService;
import org.catholicguide.auth.CurrentUser;
import org.catholicguide.categories.Category;
import org.catholicguide.categories.CategoryRepository;
import org.catholicguide.common.ApiException;
import org.catholicguide.common.Slugs;
import org.catholicguide.settings.Language;
import org.catholicguide.settings.SettingsService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PrayerService {

    public static final Set<String> READING_TIMES = Set.of("Under 1 min", "1 min", "2–5 min", "5 min", "5+ min", "9 days · 10 min a day");

    private final PrayerRepository prayers;
    private final CategoryRepository categories;
    private final SettingsService settings;
    private final ActivityService activity;
    private final CurrentUser currentUser;
    private final Clock clock;

    public PrayerService(PrayerRepository prayers, CategoryRepository categories, SettingsService settings,
                         ActivityService activity, CurrentUser currentUser, Clock clock) {
        this.prayers = prayers;
        this.categories = categories;
        this.settings = settings;
        this.activity = activity;
        this.currentUser = currentUser;
        this.clock = clock;
    }

    public record Details(Long categoryId, String readingTime, String tags, String source) {}

    public record Text(String title, String body) {}

    /** One save from the editor: shared details plus the words for the language being edited. */
    public record Edit(Details details, String lang, Text text) {}

    /** A published prayer in one language, for the public site. */
    public record PublicPrayer(Prayer prayer, String lang, String title, String body) {}

    // ------------------------------------------------------------------ public site

    /** Every prayer that is live in {@code lang}, falling back to its English version. */
    @Transactional(readOnly = true)
    public List<PublicPrayer> published(String lang) {
        return prayers.findAllWithTranslations().stream()
                .map(p -> live(p, lang))
                .flatMap(Optional::stream)
                .sorted(Comparator.comparingInt((PublicPrayer pp) -> pp.prayer().getCategory().getPosition())
                        .thenComparing(PublicPrayer::title))
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<PublicPrayer> published(String slug, String lang) {
        return prayers.findBySlug(slug).flatMap(p -> live(p, lang));
    }

    private static Optional<PublicPrayer> live(Prayer p, String lang) {
        PrayerTranslation t = p.getTranslations().get(lang);
        if (t == null || !t.isLive()) {
            t = p.getTranslations().get("en");
        }
        if (t == null || !t.isLive()) {
            return Optional.empty();
        }
        return Optional.of(new PublicPrayer(p, t.getLang(), t.getPublishedTitle(), t.getPublishedBody()));
    }

    // ------------------------------------------------------------------ portal

    @Transactional(readOnly = true)
    public List<Prayer> all() {
        return prayers.findAllWithTranslations();
    }

    @Transactional(readOnly = true)
    public Prayer require(Long id) {
        return prayers.findWithTranslationsById(id).orElseThrow(() -> ApiException.notFound("Prayer"));
    }

    @Transactional
    public Prayer create(Edit edit) {
        if (edit.text() == null || edit.text().title() == null || edit.text().title().isBlank()) {
            throw ApiException.badRequest("Give the prayer a title.");
        }
        Category category = category(edit.details() == null ? null : edit.details().categoryId());
        String slug = Slugs.unique(Slugs.of(edit.text().title(), "prayer"), prayers::existsBySlug);
        Prayer p = new Prayer(slug, category);
        apply(p, edit);
        p = prayers.save(p);
        activity.record("created", p.displayTitle());
        return p;
    }

    @Transactional
    public Prayer saveDraft(Long id, Edit edit) {
        Prayer p = require(id);
        apply(p, edit);
        activity.record("saved a draft of", label(p, edit.lang()));
        return p;
    }

    @Transactional
    public Prayer publish(Long id, String lang, Edit edit) {
        Prayer p = require(id);
        if (edit != null) {
            apply(p, edit);
        }
        PrayerTranslation t = p.getTranslations().get(lang);
        if (t == null || t.getBody().isBlank()) {
            throw ApiException.badRequest("Add the prayer text before publishing.");
        }
        t.publish(currentUser.entity(), Instant.now(clock));
        p.touch(currentUser.entity(), Instant.now(clock));
        activity.record("published", label(p, lang));
        return p;
    }

    @Transactional
    public Prayer unpublish(Long id, String lang) {
        Prayer p = require(id);
        PrayerTranslation t = p.getTranslations().get(lang);
        if (t == null) {
            throw ApiException.notFound("That translation");
        }
        t.unpublish(currentUser.entity(), Instant.now(clock));
        p.touch(currentUser.entity(), Instant.now(clock));
        activity.record("unpublished", label(p, lang));
        return p;
    }

    @Transactional
    public void delete(Long id) {
        Prayer p = require(id);
        if (p.getTranslations().values().stream().anyMatch(PrayerTranslation::isLive)) {
            throw ApiException.conflict("Unpublish every language before deleting this prayer.");
        }
        prayers.delete(p);
        activity.record("deleted", p.displayTitle());
    }

    private void apply(Prayer p, Edit edit) {
        Instant now = Instant.now(clock);
        Details d = edit.details();
        if (d != null) {
            if (d.categoryId() != null) {
                p.setCategory(category(d.categoryId()));
            }
            if (d.readingTime() != null) {
                if (!READING_TIMES.contains(d.readingTime())) {
                    throw ApiException.badRequest("Unknown reading time “" + d.readingTime() + "”.");
                }
                p.setReadingTime(d.readingTime());
            }
            if (d.tags() != null) {
                p.setTags(d.tags().strip());
            }
            if (d.source() != null) {
                p.setSource(d.source().strip());
            }
        }
        if (edit.text() != null) {
            Language lang = settings.requireEnabled(edit.lang());
            if (lang.isSongsOnly()) {
                throw ApiException.badRequest(lang.getEnglishName() + " is used for songs only.");
            }
            if (edit.text().title() == null || edit.text().title().isBlank()) {
                throw ApiException.badRequest("Give the prayer a title.");
            }
            p.getTranslations()
                    .computeIfAbsent(lang.getCode(), code -> new PrayerTranslation(p, code))
                    .edit(edit.text().title(), edit.text().body(), currentUser.entity(), now);
        }
        p.touch(currentUser.entity(), now);
    }

    private Category category(Long id) {
        if (id == null) {
            throw ApiException.badRequest("Choose a category.");
        }
        return categories.findById(id)
                .filter(c -> c.getKind() == Category.Kind.PRAYER)
                .orElseThrow(() -> ApiException.badRequest("Choose a prayer category."));
    }

    private String label(Prayer p, String lang) {
        return p.displayTitle() + " (" + settings.requireEnabled(lang).getNativeName() + ")";
    }
}
