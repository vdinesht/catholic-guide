package org.catholicguide.calendar;

import java.time.LocalDate;
import java.util.List;
import org.catholicguide.common.ApiException;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CalendarService {

    private final LiturgicalDayRepository days;

    public CalendarService(LiturgicalDayRepository days) {
        this.days = days;
    }

    /** A day as shown to visitors, in one language. */
    public record DayView(LocalDate date, String colour, String cycle, String dayName, String seasonLabel,
                          String saint, String saintNote, String shortLabel, String highlightNote) {

        static DayView of(LiturgicalDay d, String lang) {
            LiturgicalDayName n = d.name(lang);
            if (n == null) {
                return new DayView(d.getDay(), d.getColour().name(), d.getCycle(), "", "", "", "", "", "");
            }
            return new DayView(d.getDay(), d.getColour().name(), d.getCycle(), n.getDayName(), n.getSeasonLabel(),
                    n.getSaint(), n.getSaintNote(), n.getShortLabel(), n.getHighlightNote());
        }
    }

    @Transactional(readOnly = true)
    public DayView view(LocalDate date, String lang) {
        return DayView.of(require(date), lang);
    }

    @Transactional(readOnly = true)
    public List<DayView> range(LocalDate from, LocalDate to, String lang) {
        return days.findRange(from, to).stream().map(d -> DayView.of(d, lang)).toList();
    }

    @Transactional(readOnly = true)
    public List<DayView> upcoming(LocalDate after, int count, String lang) {
        return days.findHighlightsAfter(after, PageRequest.of(0, count)).stream().map(d -> DayView.of(d, lang)).toList();
    }

    @Transactional(readOnly = true)
    public LiturgicalDay require(LocalDate date) {
        return days.findById(date).orElseThrow(() ->
                ApiException.notFound("The liturgical calendar for " + date));
    }
}
