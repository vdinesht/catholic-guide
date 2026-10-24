package org.catholicguide.publicapi;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.catholicguide.calendar.CalendarService;
import org.catholicguide.calendar.CalendarService.DayView;
import org.catholicguide.calendar.LiturgicalDay;
import org.catholicguide.categories.Category;
import org.catholicguide.categories.CategoryRepository;
import org.catholicguide.prayers.PrayerService;
import org.catholicguide.prayers.PrayerService.PublicPrayer;
import org.catholicguide.prayers.PrayerTranslation;
import org.catholicguide.publicapi.PublicDtos.*;
import org.catholicguide.readings.ReadingService;
import org.catholicguide.readings.ReadingSnapshot;
import org.catholicguide.readings.ReadingText;
import org.catholicguide.settings.Language;
import org.catholicguide.settings.SettingsService;
import org.catholicguide.songs.Song;
import org.catholicguide.songs.SongService;
import org.catholicguide.songs.SongSnapshot;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Assembles what the public pages show. Only published content ever leaves this class. */
@Service
public class PublicSiteService {

    /**
     * The traditional dedication of each weekday, with the prayer the Today page offers for it.
     * Saturday is Our Lady's day, Monday the Holy Souls', Tuesday the Angels', Friday the Passion's.
     */
    private static final Map<DayOfWeek, String[]> DEVOTIONS = Map.of(
            DayOfWeek.SUNDAY, new String[] {"Sunday · the Lord's Day", "our-father"},
            DayOfWeek.MONDAY, new String[] {"Monday · for the Holy Souls", "eternal-rest"},
            DayOfWeek.TUESDAY, new String[] {"Tuesday · the Holy Angels", "st-michael"},
            DayOfWeek.WEDNESDAY, new String[] {"Wednesday · a morning offering", "morning-offering"},
            DayOfWeek.THURSDAY, new String[] {"Thursday · a morning offering", "morning-offering"},
            DayOfWeek.FRIDAY, new String[] {"Friday · the Passion of the Lord", "act-of-contrition"},
            DayOfWeek.SATURDAY, new String[] {"Saturday · dedicated to Our Lady", "memorare"});

    private final CalendarService calendar;
    private final ReadingService readings;
    private final PrayerService prayers;
    private final SongService songs;
    private final CategoryRepository categories;
    private final SettingsService settings;
    private final Clock clock;

    public PublicSiteService(CalendarService calendar, ReadingService readings, PrayerService prayers, SongService songs,
                             CategoryRepository categories, SettingsService settings, Clock clock) {
        this.calendar = calendar;
        this.readings = readings;
        this.prayers = prayers;
        this.songs = songs;
        this.categories = categories;
        this.settings = settings;
        this.clock = clock;
    }

    public LocalDate today() {
        return LocalDate.now(clock);
    }

    @Transactional(readOnly = true)
    public SiteDto site() {
        LocalDate today = today();
        String colour = calendar.range(today, today, "en").stream().findFirst().map(DayView::colour).orElse("GREEN");
        return new SiteDto(today, colour, settings.enabledLanguages().stream().map(LanguageDto::of).toList());
    }

    @Transactional(readOnly = true)
    public TodayDto todayPage(LocalDate date, String lang) {
        LiturgicalDay day = calendar.require(date);
        DayView view = calendar.view(date, lang);

        LocalDate sunday = date.with(TemporalAdjusters.previousOrSame(DayOfWeek.SUNDAY));
        Map<LocalDate, String> colours = calendar.range(sunday, sunday.plusDays(7), "en").stream()
                .collect(Collectors.toMap(DayView::date, DayView::colour));
        List<WeekDay> week = new ArrayList<>();
        for (int i = 0; i < 8; i++) {
            LocalDate d = sunday.plusDays(i);
            week.add(new WeekDay(d, colours.getOrDefault(d, "GREEN")));
        }

        ReadingsSummary summary = readingsIn(date, lang)
                .map(r -> new ReadingsSummary(r.lang(), r.snapshot().credit(), r.snapshot().quote(), r.snapshot().quoteCite(),
                        summarise(r.snapshot())))
                .orElse(null);
        List<String> others = readings.publishedLanguages(date).stream()
                .filter(l -> summary == null || !l.equals(summary.lang())).sorted().toList();

        LocalDate next = date.plusDays(1);
        Tomorrow tomorrow = readingsIn(next, lang)
                .map(r -> new Tomorrow(next, safeName(next, lang), summarise(r.snapshot())))
                .orElse(null);

        String[] dev = DEVOTIONS.get(date.getDayOfWeek());
        Devotion devotion = prayers.published(dev[1], lang)
                .map(p -> new Devotion(dev[0], p.prayer().getSlug(), p.title()))
                .orElse(null);

        return new TodayDto(date, today(), view, week, summary, others, tomorrow, devotion,
                hymnFor(day), calendar.upcoming(date, 4, lang));
    }

    @Transactional(readOnly = true)
    public ReadingsDto readingsPage(LocalDate date, String lang) {
        DayView view = calendar.view(date, lang);
        Optional<Localised> r = readingsIn(date, lang);
        return new ReadingsDto(date, today(), view, r.map(Localised::lang).orElse(null), r.map(Localised::snapshot).orElse(null),
                readings.publishedLanguages(date).stream().sorted().toList(), date.minusDays(1), date.plusDays(1));
    }

    @Transactional(readOnly = true)
    public PrayersDto prayersPage(String lang, String query) {
        List<PublicPrayer> all = prayers.published(lang);
        Map<String, Long> counts = all.stream()
                .collect(Collectors.groupingBy(p -> p.prayer().getCategory().getName(), Collectors.counting()));
        List<CategoryCount> cats = categories.findByKindOrderByPositionAsc(Category.Kind.PRAYER).stream()
                .filter(c -> counts.containsKey(c.getName()))
                .map(c -> new CategoryCount(c.getName(), counts.get(c.getName())))
                .toList();
        List<PrayerDto> list = all.stream().filter(p -> matches(p, query)).map(this::prayerDto).toList();
        return new PrayersDto(cats, list);
    }

    @Transactional(readOnly = true)
    public Optional<PrayerDto> prayer(String slug, String lang) {
        return prayers.published(slug, lang).map(this::prayerDto);
    }

    @Transactional(readOnly = true)
    public SongsDto songsPage(String query) {
        List<Song> all = songs.published();
        Map<String, Long> perLang = all.stream().collect(Collectors.groupingBy(Song::getLang, Collectors.counting()));
        List<SongLanguage> langs = new ArrayList<>();
        for (Language l : settings.enabledLanguages()) {
            if (perLang.containsKey(l.getCode())) {
                langs.add(new SongLanguage(l.getCode(), l.getNativeName(), perLang.get(l.getCode())));
            }
        }
        List<String> cats = categories.findByKindOrderByPositionAsc(Category.Kind.SONG).stream().map(Category::getName).toList();
        List<SongDto> list = all.stream().filter(s -> matches(s, query)).map(PublicSiteService::songDto).toList();
        return new SongsDto(langs, cats, list);
    }

    @Transactional(readOnly = true)
    public Optional<SongDto> song(String slug) {
        return songs.published(slug).map(PublicSiteService::songDto);
    }

    @Transactional(readOnly = true)
    public SearchDto search(String q, String lang) {
        String query = q == null ? "" : q.strip();
        if (query.length() < 2) {
            return new SearchDto(query, List.of(), List.of(), List.of());
        }
        List<ReadingHit> hits = readings.search(lang, query).stream()
                .map(r -> new ReadingHit(r.getDay(), safeName(r.getDay(), lang),
                        r.getPublished().parts().stream().map(ReadingSnapshot.Part::citation).collect(Collectors.joining(" · "))))
                .toList();
        List<PrayerDto> ps = prayers.published(lang).stream().filter(p -> matches(p, query)).map(this::prayerDto).toList();
        List<SongDto> ss = songs.published().stream().filter(s -> matches(s, query)).map(PublicSiteService::songDto).toList();
        return new SearchDto(query, hits, ps, ss);
    }

    // ------------------------------------------------------------------ helpers

    private record Localised(String lang, ReadingSnapshot snapshot) {}

    /** Readings in the visitor's language, or the English ones when that language isn't published yet. */
    private Optional<Localised> readingsIn(LocalDate date, String lang) {
        Optional<ReadingSnapshot> own = readings.published(date, lang).filter(s -> s != null);
        if (own.isPresent()) {
            return own.map(s -> new Localised(lang, s));
        }
        return readings.published(date, "en").filter(s -> s != null).map(s -> new Localised("en", s));
    }

    private static List<PartSummary> summarise(ReadingSnapshot s) {
        return s.parts().stream().map(p -> new PartSummary(p.kind(), p.citation(), ReadingText.firstLine(p))).toList();
    }

    private String safeName(LocalDate date, String lang) {
        try {
            return calendar.view(date, lang).dayName();
        } catch (RuntimeException e) {
            return "";
        }
    }

    private HymnSummary hymnFor(LiturgicalDay day) {
        Song hymn = day.getHymn();
        if (hymn == null || !hymn.isLive()) {
            List<Song> live = songs.published().stream().filter(s -> s.getLang().equals("en")).toList();
            if (live.isEmpty()) {
                return null;
            }
            hymn = live.get(day.getDay().getDayOfYear() % live.size());
        }
        SongSnapshot s = hymn.getPublished();
        String first = s.blocks().isEmpty() ? "" : s.blocks().get(0).body().lines().limit(2).collect(Collectors.joining("\n"));
        return new HymnSummary(hymn.getSlug(), s.title(), meta(s), hymn.getCategory().getName(), first);
    }

    private PrayerDto prayerDto(PublicPrayer p) {
        List<String> langs = p.prayer().getTranslations().values().stream()
                .filter(PrayerTranslation::isLive).map(PrayerTranslation::getLang).sorted().toList();
        return new PrayerDto(p.prayer().getSlug(), p.title(), p.prayer().getCategory().getName(),
                p.prayer().getReadingTime(), p.lang(), p.body(), langs);
    }

    private static SongDto songDto(Song s) {
        SongSnapshot p = s.getPublished();
        return new SongDto(s.getSlug(), p.title(), s.getLang(), s.getCategory().getName(), meta(p), p.blocks());
    }

    private static String meta(SongSnapshot s) {
        return Stream.of(s.tune(), s.author()).filter(x -> x != null && !x.isBlank())
                .collect(Collectors.joining(" · "));
    }

    private static boolean matches(PublicPrayer p, String q) {
        if (q == null || q.isBlank()) {
            return true;
        }
        String needle = q.strip().toLowerCase(Locale.ROOT);
        return (p.title() + " " + p.body() + " " + p.prayer().getTags() + " " + p.prayer().getCategory().getName())
                .toLowerCase(Locale.ROOT).contains(needle);
    }

    private static boolean matches(Song s, String q) {
        if (q == null || q.isBlank()) {
            return true;
        }
        SongSnapshot p = s.getPublished();
        String text = p.title() + " " + p.tune() + " " + p.author() + " "
                + p.blocks().stream().map(SongSnapshot.Block::body).collect(Collectors.joining(" "));
        return text.toLowerCase(Locale.ROOT).contains(q.strip().toLowerCase(Locale.ROOT));
    }
}
