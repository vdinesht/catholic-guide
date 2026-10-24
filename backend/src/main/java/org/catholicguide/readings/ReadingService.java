package org.catholicguide.readings;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import org.catholicguide.activity.ActivityService;
import org.catholicguide.auth.CurrentUser;
import org.catholicguide.calendar.LiturgicalDay;
import org.catholicguide.calendar.LiturgicalDayName;
import org.catholicguide.calendar.LiturgicalDayRepository;
import org.catholicguide.common.ApiException;
import org.catholicguide.common.ContentStatus;
import org.catholicguide.settings.Language;
import org.catholicguide.settings.SettingsService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReadingService {

    public static final List<String> PART_KINDS = List.of(
            "First Reading", "Responsorial Psalm", "Second Reading", "Gospel Acclamation", "Gospel");

    private static final DateTimeFormatter SHORT = DateTimeFormatter.ofPattern("d MMM", Locale.ENGLISH);

    private final ReadingSetRepository sets;
    private final LiturgicalDayRepository days;
    private final SettingsService settings;
    private final ActivityService activity;
    private final CurrentUser currentUser;
    private final Clock clock;

    public ReadingService(ReadingSetRepository sets, LiturgicalDayRepository days, SettingsService settings,
                          ActivityService activity, CurrentUser currentUser, Clock clock) {
        this.sets = sets;
        this.days = days;
        this.settings = settings;
        this.activity = activity;
        this.currentUser = currentUser;
        this.clock = clock;
    }

    /** Day details shared by every language (colour, cycle) and the ones edited per language (name, saint). */
    public record DayDetails(String colour, String cycle, String dayName, String saint) {}

    public record Draft(DayDetails day, ReadingSnapshot readings) {}

    // ------------------------------------------------------------------ public site

    @Transactional(readOnly = true)
    public Optional<ReadingSnapshot> published(LocalDate day, String lang) {
        return sets.findByDayAndLang(day, lang).map(ReadingSet::getPublished);
    }

    @Transactional(readOnly = true)
    public List<String> publishedLanguages(LocalDate day) {
        return sets.publishedLanguages(day);
    }

    @Transactional(readOnly = true)
    public List<ReadingSet> search(String lang, String q) {
        return sets.searchPublished(lang, q);
    }

    // ------------------------------------------------------------------ portal

    @Transactional(readOnly = true)
    public List<ReadingSet> forDay(LocalDate day) {
        return sets.findByDayOrderByLangAsc(day);
    }

    /** Status of every content language for every day in the range; days with no row are MISSING. */
    @Transactional(readOnly = true)
    public Map<LocalDate, Map<String, ContentStatus>> statuses(LocalDate from, LocalDate to) {
        Map<LocalDate, Map<String, ContentStatus>> out = new HashMap<>();
        for (ReadingSet r : sets.findRange(from, to)) {
            out.computeIfAbsent(r.getDay(), d -> new HashMap<>()).put(r.getLang(), r.status());
        }
        return out;
    }

    @Transactional(readOnly = true)
    public List<ReadingSet> unpublished() {
        return sets.findUnpublished();
    }

    @Transactional
    public ReadingSet saveDraft(LocalDate date, String lang, Draft draft) {
        ReadingSet set = upsert(date, lang, draft);
        activity.record("saved a draft of", label(date, lang));
        return set;
    }

    @Transactional
    public ReadingSet publish(LocalDate date, String lang, Draft draft) {
        ReadingSet set = draft != null ? upsert(date, lang, draft) : require(date, lang);
        ReadingSnapshot w = set.working();
        if (w.parts().isEmpty()) {
            throw ApiException.badRequest("Add at least one reading before publishing.");
        }
        for (ReadingSnapshot.Part p : w.parts()) {
            if (p.citation().isBlank() || p.body().isBlank()) {
                throw ApiException.badRequest(p.kind() + " needs a citation and text before publishing.");
            }
        }
        set.publish(currentUser.entity(), Instant.now(clock));
        activity.record("published", label(date, lang));
        return set;
    }

    @Transactional
    public ReadingSet unpublish(LocalDate date, String lang) {
        ReadingSet set = require(date, lang);
        set.unpublish(currentUser.entity(), Instant.now(clock));
        activity.record("unpublished", label(date, lang));
        return set;
    }

    @Transactional
    public void delete(LocalDate date, String lang) {
        ReadingSet set = require(date, lang);
        if (set.status().isLive()) {
            throw ApiException.conflict("Unpublish this language before removing it.");
        }
        sets.delete(set);
        activity.record("removed", label(date, lang));
    }

    public String label(LocalDate date, String lang) {
        Language l = settings.requireEnabled(lang);
        return "Readings · " + date.format(SHORT) + " (" + l.getNativeName() + ")";
    }

    private ReadingSet require(LocalDate date, String lang) {
        return sets.findByDayAndLang(date, lang).orElseThrow(() -> ApiException.notFound("Readings"));
    }

    private ReadingSet upsert(LocalDate date, String lang, Draft draft) {
        Language language = settings.requireEnabled(lang);
        if (language.isSongsOnly()) {
            throw ApiException.badRequest(language.getEnglishName() + " is used for songs only.");
        }
        List<ReadingSnapshot.Part> parts = draft.readings() == null || draft.readings().parts() == null
                ? List.of() : draft.readings().parts();
        for (ReadingSnapshot.Part p : parts) {
            if (!PART_KINDS.contains(p.kind())) {
                throw ApiException.badRequest("Unknown reading type “" + p.kind() + "”.");
            }
        }
        if (draft.day() != null) {
            applyDayDetails(date, lang, draft.day());
        }
        ReadingSet set = sets.findByDayAndLang(date, lang).orElseGet(() -> new ReadingSet(date, lang));
        ReadingSnapshot r = draft.readings();
        set.edit(new ReadingSnapshot(r == null ? "" : r.credit(), r == null ? "" : r.quote(),
                r == null ? "" : r.quoteCite(), new ArrayList<>(parts)), currentUser.entity(), Instant.now(clock));
        return sets.save(set);
    }

    private void applyDayDetails(LocalDate date, String lang, DayDetails d) {
        LiturgicalDay day = days.findById(date).orElseGet(() ->
                days.save(new LiturgicalDay(date, LiturgicalDay.Colour.GREEN, "")));
        if (d.colour() != null) {
            try {
                day.setColour(LiturgicalDay.Colour.valueOf(d.colour()));
            } catch (IllegalArgumentException e) {
                throw ApiException.badRequest("Unknown liturgical colour “" + d.colour() + "”.");
            }
        }
        if (d.cycle() != null) {
            day.setCycle(d.cycle().strip());
        }
        LiturgicalDayName name = day.nameForEdit(lang);
        if (d.dayName() != null) {
            name.setDayName(d.dayName().strip());
        }
        if (d.saint() != null) {
            name.setSaint(d.saint().strip());
        }
    }
}
