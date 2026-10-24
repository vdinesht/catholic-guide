package org.catholicguide.portal;

import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.catholicguide.activity.ActivityService;
import org.catholicguide.calendar.CalendarService;
import org.catholicguide.common.ContentStatus;
import org.catholicguide.portal.PortalDtos.*;
import org.catholicguide.prayers.PrayerService;
import org.catholicguide.prayers.PrayerTranslation;
import org.catholicguide.readings.ReadingService;
import org.catholicguide.settings.Language;
import org.catholicguide.settings.SettingsService;
import org.catholicguide.songs.SongService;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/portal")
public class DashboardController {

    private static final int COVERAGE_DAYS = 14;

    private final CalendarService calendar;
    private final ReadingService readings;
    private final PrayerService prayers;
    private final SongService songs;
    private final SettingsService settings;
    private final ActivityService activity;
    private final PortalMetaService meta;
    private final Clock clock;

    public DashboardController(CalendarService calendar, ReadingService readings, PrayerService prayers, SongService songs,
                               SettingsService settings, ActivityService activity, PortalMetaService meta, Clock clock) {
        this.calendar = calendar;
        this.readings = readings;
        this.prayers = prayers;
        this.songs = songs;
        this.settings = settings;
        this.activity = activity;
        this.meta = meta;
        this.clock = clock;
    }

    @GetMapping("/meta")
    public MetaDto meta() {
        return meta.meta();
    }

    @GetMapping("/dashboard")
    @Transactional(readOnly = true)
    public DashboardDto dashboard() {
        LocalDate today = LocalDate.now(clock);
        List<Language> langs = settings.contentLanguages();
        Map<String, String> nativeNames = new HashMap<>();
        settings.enabledLanguages().forEach(l -> nativeNames.put(l.getCode(), l.getNativeName()));

        // Readings coverage for the next two weeks.
        LocalDate last = today.plusDays(COVERAGE_DAYS - 1);
        Map<LocalDate, Map<String, ContentStatus>> st = readings.statuses(today, last);
        List<LocalDate> days = today.datesUntil(last.plusDays(1)).toList();
        List<CoverageRow> rows = langs.stream().map(l -> {
            List<ContentStatus> cells = days.stream()
                    .map(d -> st.getOrDefault(d, Map.of()).getOrDefault(l.getCode(), ContentStatus.MISSING))
                    .toList();
            long ready = cells.stream().filter(ContentStatus::isLive).count();
            return new CoverageRow(l.getCode(), l.getNativeName(), cells, ready);
        }).toList();

        // Everything with unpublished work, newest first.
        List<DraftItem> drafts = new ArrayList<>();
        readings.unpublished().forEach(r -> drafts.add(new DraftItem("READING", "Readings · " + r.getDay(), r.getLang(),
                nativeNames.getOrDefault(r.getLang(), r.getLang()), PortalDtos.who(r.getUpdatedBy()), r.getUpdatedAt(),
                r.getDay(), null, r.status())));
        prayers.all().forEach(p -> p.getTranslations().values().stream()
                .filter(t -> t.status() == ContentStatus.DRAFT || t.status() == ContentStatus.CHANGES)
                .forEach((PrayerTranslation t) -> drafts.add(new DraftItem("PRAYER", p.displayTitle(), t.getLang(),
                        nativeNames.getOrDefault(t.getLang(), t.getLang()), PortalDtos.who(t.getUpdatedBy()), t.getUpdatedAt(),
                        null, p.getId(), t.status()))));
        songs.unpublished().forEach(s -> drafts.add(new DraftItem("SONG", s.getTitle(), s.getLang(),
                nativeNames.getOrDefault(s.getLang(), s.getLang()), PortalDtos.who(s.getUpdatedBy()), s.getUpdatedAt(),
                null, s.getId(), s.status())));
        drafts.sort(Comparator.comparing(DraftItem::updatedAt).reversed());

        CalendarService.DayView day = calendar.range(today, today, "en").stream().findFirst().orElse(null);
        return new DashboardDto(today, day, new Coverage(days, rows),
                drafts.stream().limit(8).toList(), activity.latest(5, null));
    }
}
