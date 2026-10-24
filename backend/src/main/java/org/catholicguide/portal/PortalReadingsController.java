package org.catholicguide.portal;

import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.catholicguide.calendar.CalendarService;
import org.catholicguide.common.ApiException;
import org.catholicguide.common.ContentStatus;
import org.catholicguide.portal.PortalDtos.*;
import org.catholicguide.readings.ReadingService;
import org.catholicguide.settings.SettingsService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/portal/readings")
public class PortalReadingsController {

    private final ReadingService readings;
    private final CalendarService calendar;
    private final ReadingEditorAssembler editor;
    private final SettingsService settings;
    private final Clock clock;

    public PortalReadingsController(ReadingService readings, CalendarService calendar, ReadingEditorAssembler editor,
                                    SettingsService settings, Clock clock) {
        this.readings = readings;
        this.calendar = calendar;
        this.editor = editor;
        this.settings = settings;
        this.clock = clock;
    }

    /** One month of days with each language's status, for the calendar grid. */
    @GetMapping
    public CalendarDto month(@RequestParam(required = false) String month) {
        YearMonth ym;
        try {
            ym = month == null ? YearMonth.now(clock) : YearMonth.parse(month);
        } catch (RuntimeException e) {
            throw ApiException.badRequest("Month must look like 2026-10.");
        }
        LocalDate from = ym.atDay(1), to = ym.atEndOfMonth();
        Map<LocalDate, CalendarService.DayView> known = new HashMap<>();
        calendar.range(from, to, "en").forEach(d -> known.put(d.date(), d));
        Map<LocalDate, Map<String, ContentStatus>> statuses = readings.statuses(from, to);
        List<CalendarDay> out = from.datesUntil(to.plusDays(1)).map(d -> {
            CalendarService.DayView v = known.get(d);
            return new CalendarDay(d, v == null ? "" : v.shortLabel(), v == null ? "GREEN" : v.colour(),
                    statuses.getOrDefault(d, Map.of()));
        }).toList();
        return new CalendarDto(ym.toString(), LocalDate.now(clock),
                settings.contentLanguages().stream().map(LanguageDto::of).toList(), out);
    }

    @GetMapping("/{date}")
    public ReadingEditorDto get(@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return editor.view(date);
    }

    @PutMapping("/{date}/{lang}")
    public ReadingEditorDto save(@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                 @PathVariable String lang, @RequestBody ReadingService.Draft draft) {
        readings.saveDraft(date, lang, draft);
        return editor.view(date);
    }

    @PostMapping("/{date}/{lang}/publish")
    public ReadingEditorDto publish(@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                    @PathVariable String lang, @RequestBody(required = false) ReadingService.Draft draft) {
        readings.publish(date, lang, draft);
        return editor.view(date);
    }

    @PostMapping("/{date}/{lang}/unpublish")
    public ReadingEditorDto unpublish(@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                      @PathVariable String lang) {
        readings.unpublish(date, lang);
        return editor.view(date);
    }

    @DeleteMapping("/{date}/{lang}")
    public ReadingEditorDto delete(@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                   @PathVariable String lang) {
        readings.delete(date, lang);
        return editor.view(date);
    }
}
