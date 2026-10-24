package org.catholicguide.publicapi;

import java.time.LocalDate;
import org.catholicguide.common.ApiException;
import org.catholicguide.publicapi.PublicDtos.*;
import org.catholicguide.settings.SettingsService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public")
public class PublicController {

    private final PublicSiteService site;
    private final SettingsService settings;

    public PublicController(PublicSiteService site, SettingsService settings) {
        this.site = site;
        this.settings = settings;
    }

    @GetMapping("/site")
    public SiteDto site() {
        return site.site();
    }

    @GetMapping("/today")
    public TodayDto today(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                          @RequestParam(defaultValue = "en") String lang) {
        return site.todayPage(date == null ? site.today() : date, language(lang));
    }

    @GetMapping("/readings/{date}")
    public ReadingsDto readings(@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                @RequestParam(defaultValue = "en") String lang) {
        return site.readingsPage(date, language(lang));
    }

    @GetMapping("/prayers")
    public PrayersDto prayers(@RequestParam(defaultValue = "en") String lang, @RequestParam(required = false) String q) {
        return site.prayersPage(language(lang), q);
    }

    @GetMapping("/prayers/{slug}")
    public PrayerDto prayer(@PathVariable String slug, @RequestParam(defaultValue = "en") String lang) {
        return site.prayer(slug, language(lang)).orElseThrow(() -> ApiException.notFound("Prayer"));
    }

    @GetMapping("/songs")
    public SongsDto songs(@RequestParam(required = false) String q) {
        return site.songsPage(q);
    }

    @GetMapping("/songs/{slug}")
    public SongDto song(@PathVariable String slug) {
        return site.song(slug).orElseThrow(() -> ApiException.notFound("Song"));
    }

    @GetMapping("/search")
    public SearchDto search(@RequestParam String q, @RequestParam(defaultValue = "en") String lang) {
        return site.search(q, language(lang));
    }

    /** Unknown or switched-off languages quietly fall back to English rather than failing the page. */
    private String language(String code) {
        return settings.enabledLanguages().stream().anyMatch(l -> l.getCode().equals(code) && !l.isSongsOnly()) ? code : "en";
    }
}
