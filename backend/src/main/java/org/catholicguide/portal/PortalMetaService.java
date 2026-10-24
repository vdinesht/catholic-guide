package org.catholicguide.portal;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.catholicguide.categories.Category;
import org.catholicguide.categories.CategoryRepository;
import org.catholicguide.portal.PortalDtos.CategoryDto;
import org.catholicguide.portal.PortalDtos.LanguageDto;
import org.catholicguide.portal.PortalDtos.MetaDto;
import org.catholicguide.prayers.PrayerService;
import org.catholicguide.readings.ReadingService;
import org.catholicguide.settings.SettingsService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PortalMetaService {

    private static final List<String> READING_TIMES = List.of("Under 1 min", "1 min", "2–5 min", "5+ min");

    private final SettingsService settings;
    private final CategoryRepository categories;

    public PortalMetaService(SettingsService settings, CategoryRepository categories) {
        this.settings = settings;
        this.categories = categories;
    }

    @Transactional(readOnly = true)
    public MetaDto meta() {
        return new MetaDto(
                settings.contentLanguages().stream().map(LanguageDto::of).toList(),
                settings.enabledLanguages().stream().map(LanguageDto::of).toList(),
                categories(Category.Kind.PRAYER),
                categories(Category.Kind.SONG),
                READING_TIMES.stream().filter(PrayerService.READING_TIMES::contains).toList(),
                ReadingService.PART_KINDS);
    }

    @Transactional(readOnly = true)
    public List<CategoryDto> categories(Category.Kind kind) {
        Map<Long, Long> counts = new HashMap<>();
        for (Object[] row : kind == Category.Kind.PRAYER ? categories.prayerCounts() : categories.songCounts()) {
            counts.put((Long) row[0], (Long) row[1]);
        }
        return categories.findByKindOrderByPositionAsc(kind).stream()
                .map(c -> CategoryDto.of(c, counts.getOrDefault(c.getId(), 0L)))
                .toList();
    }
}
