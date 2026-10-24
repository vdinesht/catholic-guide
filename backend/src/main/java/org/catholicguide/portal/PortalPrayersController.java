package org.catholicguide.portal;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.catholicguide.common.ContentStatus;
import org.catholicguide.portal.PortalDtos.PrayerDetail;
import org.catholicguide.portal.PortalDtos.PrayerRow;
import org.catholicguide.portal.PortalDtos.TranslationDto;
import org.catholicguide.prayers.Prayer;
import org.catholicguide.prayers.PrayerService;
import org.catholicguide.prayers.PrayerTranslation;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Endpoints are transactional so the response can be built from the entities they change. */
@RestController
@RequestMapping("/api/portal/prayers")
public class PortalPrayersController {

    private final PrayerService prayers;

    public PortalPrayersController(PrayerService prayers) {
        this.prayers = prayers;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<PrayerRow> list() {
        return prayers.all().stream().map(p -> {
            Map<String, ContentStatus> st = new HashMap<>();
            p.getTranslations().forEach((lang, t) -> st.put(lang, t.status()));
            PrayerTranslation en = p.getTranslations().get("en");
            return new PrayerRow(p.getId(), p.displayTitle(), p.getCategory().getName(), st,
                    en != null && en.isLive(), PortalDtos.who(p.getUpdatedBy()), p.getUpdatedAt());
        }).toList();
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public PrayerDetail get(@PathVariable Long id) {
        return detail(prayers.require(id));
    }

    @PostMapping
    @Transactional
    public PrayerDetail create(@RequestBody PrayerService.Edit edit) {
        return detail(prayers.create(edit));
    }

    @PutMapping("/{id}")
    @Transactional
    public PrayerDetail save(@PathVariable Long id, @RequestBody PrayerService.Edit edit) {
        return detail(prayers.saveDraft(id, edit));
    }

    @PostMapping("/{id}/publish")
    @Transactional
    public PrayerDetail publish(@PathVariable Long id, @RequestParam String lang,
                                @RequestBody(required = false) PrayerService.Edit edit) {
        return detail(prayers.publish(id, lang, edit));
    }

    @PostMapping("/{id}/unpublish")
    @Transactional
    public PrayerDetail unpublish(@PathVariable Long id, @RequestParam String lang) {
        return detail(prayers.unpublish(id, lang));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        prayers.delete(id);
        return ResponseEntity.noContent().build();
    }

    private static PrayerDetail detail(Prayer p) {
        Map<String, TranslationDto> tr = new HashMap<>();
        p.getTranslations().forEach((lang, t) -> tr.put(lang,
                new TranslationDto(t.getTitle(), t.getBody(), t.status(), PortalDtos.who(t.getUpdatedBy()), t.getUpdatedAt())));
        return new PrayerDetail(p.getId(), p.getSlug(), p.getCategory().getId(), p.getReadingTime(), p.getTags(),
                p.getSource(), tr, PortalDtos.who(p.getUpdatedBy()), p.getUpdatedAt());
    }
}
