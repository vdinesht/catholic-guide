package org.catholicguide.publicapi;

import java.time.LocalDate;
import java.util.List;
import org.catholicguide.calendar.CalendarService.DayView;
import org.catholicguide.readings.ReadingSnapshot;
import org.catholicguide.settings.Language;
import org.catholicguide.songs.SongSnapshot;

/** Response shapes for the public website. */
public final class PublicDtos {

    private PublicDtos() {}

    public record LanguageDto(String code, String nativeName, String englishName, boolean songsOnly) {
        static LanguageDto of(Language l) {
            return new LanguageDto(l.getCode(), l.getNativeName(), l.getEnglishName(), l.isSongsOnly());
        }
    }

    public record SiteDto(LocalDate today, String colour, List<LanguageDto> languages) {}

    public record WeekDay(LocalDate date, String colour) {}

    public record PartSummary(String kind, String citation, String firstLine) {}

    public record ReadingsSummary(String lang, String credit, String quote, String quoteCite, List<PartSummary> parts) {}

    public record Tomorrow(LocalDate date, String dayName, List<PartSummary> parts) {}

    public record Devotion(String label, String prayerSlug, String prayerTitle) {}

    public record HymnSummary(String slug, String title, String meta, String category, String firstLines) {}

    public record TodayDto(LocalDate date, LocalDate today, DayView day, List<WeekDay> week, ReadingsSummary readings,
                           List<String> otherLanguages, Tomorrow tomorrow, Devotion devotion, HymnSummary hymn,
                           List<DayView> upcoming) {}

    public record ReadingsDto(LocalDate date, LocalDate today, DayView day, String readingsLang,
                              ReadingSnapshot readings, List<String> availableLanguages,
                              LocalDate previous, LocalDate next) {}

    public record PrayerDto(String slug, String title, String category, String readingTime, String lang, String body,
                            List<String> availableLanguages) {}

    public record CategoryCount(String name, long count) {}

    public record PrayersDto(List<CategoryCount> categories, List<PrayerDto> prayers) {}

    public record SongDto(String slug, String title, String lang, String category, String meta, List<SongSnapshot.Block> blocks) {}

    public record SongLanguage(String code, String nativeName, long count) {}

    public record SongsDto(List<SongLanguage> languages, List<String> categories, List<SongDto> songs) {}

    public record ReadingHit(LocalDate date, String dayName, String citations) {}

    public record SearchDto(String q, List<ReadingHit> readings, List<PrayerDto> prayers, List<SongDto> songs) {}
}
