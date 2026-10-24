package org.catholicguide.calendar;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.time.LocalDate;
import java.util.Objects;

@Entity
@Table(name = "liturgical_day_names")
@IdClass(LiturgicalDayName.Key.class)
public class LiturgicalDayName {

    public static class Key implements Serializable {
        private LocalDate day;
        private String lang;

        public Key() {}

        @Override
        public boolean equals(Object o) {
            return o instanceof Key k && Objects.equals(day, k.day) && Objects.equals(lang, k.lang);
        }

        @Override
        public int hashCode() {
            return Objects.hash(day, lang);
        }
    }

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "day")
    private LiturgicalDay day;

    @Id
    private String lang;

    @Column(nullable = false)
    private String dayName = "";

    @Column(nullable = false)
    private String seasonLabel = "";

    @Column(nullable = false)
    private String saint = "";

    @Column(nullable = false)
    private String saintNote = "";

    @Column(nullable = false)
    private String shortLabel = "";

    @Column(nullable = false)
    private String highlightNote = "";

    protected LiturgicalDayName() {}

    LiturgicalDayName(LiturgicalDay day, String lang) {
        this.day = day;
        this.lang = lang;
    }

    public String getLang() { return lang; }
    public String getDayName() { return dayName; }
    public void setDayName(String dayName) { this.dayName = dayName; }
    public String getSeasonLabel() { return seasonLabel; }
    public String getSaint() { return saint; }
    public void setSaint(String saint) { this.saint = saint; }
    public String getSaintNote() { return saintNote; }
    public String getShortLabel() { return shortLabel; }
    public String getHighlightNote() { return highlightNote; }
}
