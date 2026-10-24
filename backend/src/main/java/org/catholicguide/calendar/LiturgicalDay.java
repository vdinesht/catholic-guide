package org.catholicguide.calendar;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapKey;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import org.catholicguide.songs.Song;

@Entity
@Table(name = "liturgical_days")
public class LiturgicalDay {

    /** Liturgical colours. White is shown as gold so it stays visible on the page. */
    public enum Colour { GREEN, VIOLET, WHITE, RED, ROSE }

    @Id
    private LocalDate day;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Colour colour;

    @Column(nullable = false)
    private String cycle;

    private boolean highlight;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hymn_song_id")
    private Song hymn;

    @OneToMany(mappedBy = "day", cascade = CascadeType.ALL, orphanRemoval = true)
    @MapKey(name = "lang")
    private Map<String, LiturgicalDayName> names = new HashMap<>();

    protected LiturgicalDay() {}

    public LiturgicalDay(LocalDate day, Colour colour, String cycle) {
        this.day = day;
        this.colour = colour;
        this.cycle = cycle;
    }

    public LocalDate getDay() { return day; }
    public Colour getColour() { return colour; }
    public void setColour(Colour colour) { this.colour = colour; }
    public String getCycle() { return cycle; }
    public void setCycle(String cycle) { this.cycle = cycle; }
    public boolean isHighlight() { return highlight; }
    public Song getHymn() { return hymn; }
    public Map<String, LiturgicalDayName> getNames() { return names; }

    /** The name in {@code lang}, falling back to English. */
    public LiturgicalDayName name(String lang) {
        LiturgicalDayName n = names.get(lang);
        return n != null ? n : names.get("en");
    }

    public LiturgicalDayName nameForEdit(String lang) {
        return names.computeIfAbsent(lang, l -> new LiturgicalDayName(this, l));
    }
}
