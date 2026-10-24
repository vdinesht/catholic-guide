package org.catholicguide.portal;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.catholicguide.activity.ActivityService;
import org.catholicguide.calendar.CalendarService.DayView;
import org.catholicguide.categories.Category;
import org.catholicguide.common.ContentStatus;
import org.catholicguide.readings.ReadingSnapshot;
import org.catholicguide.settings.Language;
import org.catholicguide.songs.SongSnapshot;
import org.catholicguide.users.User;

/** Response shapes for the content portal. */
public final class PortalDtos {

    private PortalDtos() {}

    public record LanguageDto(String code, String nativeName, String englishName, boolean enabled, boolean isDefault,
                              boolean songsOnly) {
        public static LanguageDto of(Language l) {
            return new LanguageDto(l.getCode(), l.getNativeName(), l.getEnglishName(), l.isEnabled(), l.isDefault(), l.isSongsOnly());
        }
    }

    public record CategoryDto(Long id, String name, long count) {
        public static CategoryDto of(Category c, long count) {
            return new CategoryDto(c.getId(), c.getName(), count);
        }
    }

    /** Lists the editor forms need: languages, categories and the fixed choices. */
    public record MetaDto(List<LanguageDto> contentLanguages, List<LanguageDto> songLanguages,
                          List<CategoryDto> prayerCategories, List<CategoryDto> songCategories,
                          List<String> readingTimes, List<String> partKinds) {}

    public static String who(User u) {
        return u == null ? "" : u.getName();
    }

    // ------------------------------------------------------------------ dashboard

    public record CoverageRow(String lang, String nativeName, List<ContentStatus> cells, long ready) {}

    public record Coverage(List<LocalDate> days, List<CoverageRow> rows) {}

    /** A link target inside the portal: kind READING uses date + lang, PRAYER and SONG use id (+ lang). */
    public record DraftItem(String kind, String title, String lang, String nativeName, String who, Instant updatedAt,
                            LocalDate date, Long id, ContentStatus status) {}

    public record DashboardDto(LocalDate today, DayView day, Coverage coverage, List<DraftItem> drafts,
                               List<ActivityService.Entry> activity) {}

    // ------------------------------------------------------------------ readings

    public record CalendarDay(LocalDate date, String label, String colour, Map<String, ContentStatus> statuses) {}

    public record CalendarDto(String month, LocalDate today, List<LanguageDto> languages, List<CalendarDay> days) {}

    public record DayName(String dayName, String saint) {}

    public record ReadingSetDto(String lang, ContentStatus status, ReadingSnapshot working, String who, Instant updatedAt) {}

    public record ReadingEditorDto(LocalDate date, String colour, String cycle, Map<String, DayName> names,
                                   List<LanguageDto> languages, Map<String, ReadingSetDto> sets, String activityLabel) {}

    // ------------------------------------------------------------------ prayers

    public record PrayerRow(Long id, String title, String category, Map<String, ContentStatus> statuses, boolean live,
                            String who, Instant updatedAt) {}

    public record TranslationDto(String title, String body, ContentStatus status, String who, Instant updatedAt) {}

    public record PrayerDetail(Long id, String slug, Long categoryId, String readingTime, String tags, String source,
                               Map<String, TranslationDto> translations, String who, Instant updatedAt) {}

    // ------------------------------------------------------------------ songs

    public record SongRow(Long id, String title, String category, String lang, ContentStatus status, String rights,
                          String who, Instant updatedAt) {}

    public record SongDetail(Long id, String slug, String lang, Long categoryId, String rights, String licenceNumber,
                             SongSnapshot lyrics, ContentStatus status, String who, Instant updatedAt) {}

    // ------------------------------------------------------------------ users & settings

    public record UserDto(Long id, String name, String email, String role, String status, Instant lastSignInAt,
                          boolean isMe) {}

    public record SignInDto(int codeExpiryMinutes, int sessionDays, String allowedDomains) {}

    public record SettingsDto(List<LanguageDto> languages, List<CategoryDto> prayerCategories,
                              List<CategoryDto> songCategories, SignInDto signIn) {}
}
