package org.catholicguide.songs;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.catholicguide.activity.ActivityService;
import org.catholicguide.auth.CurrentUser;
import org.catholicguide.categories.Category;
import org.catholicguide.categories.CategoryRepository;
import org.catholicguide.common.ApiException;
import org.catholicguide.common.Slugs;
import org.catholicguide.settings.SettingsService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SongService {

    private static final Set<String> BLOCK_TYPES = Set.of("VERSE", "REFRAIN");

    private final SongRepository songs;
    private final CategoryRepository categories;
    private final SettingsService settings;
    private final ActivityService activity;
    private final CurrentUser currentUser;
    private final Clock clock;

    public SongService(SongRepository songs, CategoryRepository categories, SettingsService settings,
                       ActivityService activity, CurrentUser currentUser, Clock clock) {
        this.songs = songs;
        this.categories = categories;
        this.settings = settings;
        this.activity = activity;
        this.currentUser = currentUser;
        this.clock = clock;
    }

    public record Edit(String lang, Long categoryId, String rights, String licenceNumber, SongSnapshot lyrics) {}

    // ------------------------------------------------------------------ public site

    @Transactional(readOnly = true)
    public List<Song> published() {
        return songs.findPublished();
    }

    @Transactional(readOnly = true)
    public Optional<Song> published(String slug) {
        return songs.findBySlug(slug).filter(Song::isLive);
    }

    // ------------------------------------------------------------------ portal

    @Transactional(readOnly = true)
    public List<Song> all() {
        return songs.findAllForPortal();
    }

    @Transactional(readOnly = true)
    public List<Song> unpublished() {
        return songs.findUnpublished();
    }

    @Transactional(readOnly = true)
    public Song require(Long id) {
        return songs.findWithBlocksById(id).orElseThrow(() -> ApiException.notFound("Song"));
    }

    @Transactional
    public Song create(Edit edit) {
        String title = edit.lyrics() == null ? null : edit.lyrics().title();
        if (title == null || title.isBlank()) {
            throw ApiException.badRequest("Give the song a title.");
        }
        Song s = new Song(Slugs.unique(Slugs.of(title, "song"), songs::existsBySlug));
        apply(s, edit);
        s = songs.save(s);
        activity.record("created", s.getTitle());
        return s;
    }

    @Transactional
    public Song saveDraft(Long id, Edit edit) {
        Song s = require(id);
        apply(s, edit);
        activity.record("saved a draft of", label(s));
        return s;
    }

    @Transactional
    public Song publish(Long id, Edit edit) {
        Song s = require(id);
        if (edit != null) {
            apply(s, edit);
        }
        if (s.getRights() == Song.Rights.NEEDS_CHECKING) {
            throw ApiException.badRequest("Check the rights to these lyrics before publishing.");
        }
        if (s.getRights() == Song.Rights.LICENSED && s.getLicenceNumber().isBlank()) {
            throw ApiException.badRequest("Licensed lyrics need a licence number before they can be published.");
        }
        if (s.working().blocks().stream().allMatch(b -> b.body().isBlank())) {
            throw ApiException.badRequest("Add the lyrics before publishing.");
        }
        s.publish(Instant.now(clock));
        s.touch(currentUser.entity(), Instant.now(clock));
        activity.record("published", label(s));
        return s;
    }

    @Transactional
    public Song unpublish(Long id) {
        Song s = require(id);
        s.unpublish();
        s.touch(currentUser.entity(), Instant.now(clock));
        activity.record("unpublished", label(s));
        return s;
    }

    @Transactional
    public void delete(Long id) {
        Song s = require(id);
        if (s.isLive()) {
            throw ApiException.conflict("Unpublish this song before deleting it.");
        }
        songs.delete(s);
        activity.record("deleted", s.getTitle());
    }

    private void apply(Song s, Edit edit) {
        if (edit.lang() != null) {
            s.setLang(settings.requireEnabled(edit.lang()).getCode());
        } else if (s.getLang() == null) {
            throw ApiException.badRequest("Choose the song's language.");
        }
        if (edit.categoryId() != null) {
            s.setCategory(categories.findById(edit.categoryId())
                    .filter(c -> c.getKind() == Category.Kind.SONG)
                    .orElseThrow(() -> ApiException.badRequest("Choose a song category.")));
        } else if (s.getCategory() == null) {
            throw ApiException.badRequest("Choose a category.");
        }
        if (edit.rights() != null) {
            try {
                s.setRights(Song.Rights.valueOf(edit.rights()));
            } catch (IllegalArgumentException e) {
                throw ApiException.badRequest("Unknown rights status “" + edit.rights() + "”.");
            }
        }
        if (edit.licenceNumber() != null) {
            s.setLicenceNumber(edit.licenceNumber().strip());
        }
        if (edit.lyrics() != null) {
            SongSnapshot l = edit.lyrics();
            if (l.title() == null || l.title().isBlank()) {
                throw ApiException.badRequest("Give the song a title.");
            }
            List<SongSnapshot.Block> blocks = l.blocks() == null ? List.of() : l.blocks();
            for (SongSnapshot.Block b : blocks) {
                if (!BLOCK_TYPES.contains(b.type())) {
                    throw ApiException.badRequest("A block must be a verse or a refrain.");
                }
            }
            s.edit(new SongSnapshot(l.title(), l.author(), l.tune(), blocks));
        }
        s.touch(currentUser.entity(), Instant.now(clock));
    }

    private String label(Song s) {
        return s.getTitle() + " (" + settings.requireEnabled(s.getLang()).getNativeName() + ")";
    }
}
