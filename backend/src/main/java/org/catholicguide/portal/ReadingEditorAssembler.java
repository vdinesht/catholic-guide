package org.catholicguide.portal;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import org.catholicguide.calendar.LiturgicalDay;
import org.catholicguide.calendar.LiturgicalDayRepository;
import org.catholicguide.portal.PortalDtos.DayName;
import org.catholicguide.portal.PortalDtos.LanguageDto;
import org.catholicguide.portal.PortalDtos.ReadingEditorDto;
import org.catholicguide.portal.PortalDtos.ReadingSetDto;
import org.catholicguide.readings.ReadingService;
import org.catholicguide.readings.ReadingSet;
import org.catholicguide.settings.SettingsService;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Builds the reading editor's view of one day: shared day details plus every language's working copy. */
@Component
public class ReadingEditorAssembler {

    private final ReadingService readings;
    private final LiturgicalDayRepository days;
    private final SettingsService settings;

    public ReadingEditorAssembler(ReadingService readings, LiturgicalDayRepository days, SettingsService settings) {
        this.readings = readings;
        this.days = days;
        this.settings = settings;
    }

    @Transactional(readOnly = true)
    public ReadingEditorDto view(LocalDate date) {
        LiturgicalDay day = days.findById(date).orElse(null);
        Map<String, DayName> names = new HashMap<>();
        if (day != null) {
            day.getNames().forEach((lang, n) -> names.put(lang, new DayName(n.getDayName(), n.getSaint())));
        }
        Map<String, ReadingSetDto> sets = new HashMap<>();
        for (ReadingSet r : readings.forDay(date)) {
            sets.put(r.getLang(), new ReadingSetDto(r.getLang(), r.status(), r.working(), PortalDtos.who(r.getUpdatedBy()),
                    r.getUpdatedAt()));
        }
        return new ReadingEditorDto(date,
                day == null ? "GREEN" : day.getColour().name(),
                day == null ? "" : day.getCycle(),
                names,
                settings.contentLanguages().stream().map(LanguageDto::of).toList(),
                sets,
                readings.label(date, "en").replace(" (English)", ""));
    }
}
