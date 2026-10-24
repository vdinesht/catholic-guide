package org.catholicguide.portal;

import java.util.stream.Stream;
import org.catholicguide.activity.ActivityService;
import org.catholicguide.categories.Category;
import org.catholicguide.common.ApiException;
import org.catholicguide.portal.PortalDtos.CategoryDto;
import org.catholicguide.portal.PortalDtos.LanguageDto;
import org.catholicguide.portal.PortalDtos.SettingsDto;
import org.catholicguide.portal.PortalDtos.SignInDto;
import org.catholicguide.settings.LanguageService;
import org.catholicguide.settings.SettingsService;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Anyone signed in may read settings; only admins may change them (see SecurityConfig). */
@RestController
@RequestMapping("/api/portal/settings")
public class SettingsController {

    private final SettingsService settings;
    private final LanguageService languages;
    private final PortalMetaService meta;
    private final ActivityService activity;

    public SettingsController(SettingsService settings, LanguageService languages, PortalMetaService meta,
                              ActivityService activity) {
        this.settings = settings;
        this.languages = languages;
        this.meta = meta;
        this.activity = activity;
    }

    public record EnabledRequest(boolean enabled) {}

    public record NewLanguage(String code, String nativeName, String englishName, boolean songsOnly) {}

    public record CategoryRequest(Category.Kind kind, String name) {}

    @GetMapping
    public SettingsDto get() {
        SettingsService.SignInSettings s = settings.signIn();
        return new SettingsDto(
                languages.all().stream().map(LanguageDto::of).toList(),
                meta.categories(Category.Kind.PRAYER),
                meta.categories(Category.Kind.SONG),
                new SignInDto(s.codeExpiryMinutes(), s.sessionDays(), String.join(", ", s.allowedDomains())));
    }

    @PutMapping("/sign-in")
    public SettingsDto signIn(@RequestBody SignInDto req) {
        settings.updateSignIn(req.codeExpiryMinutes(), req.sessionDays(), req.allowedDomains());
        activity.record("changed", "sign-in settings");
        return get();
    }

    @PutMapping("/languages/{code}")
    public SettingsDto setLanguage(@PathVariable String code, @RequestBody EnabledRequest req) {
        languages.setEnabled(code, req.enabled());
        return get();
    }

    @PostMapping("/languages")
    public SettingsDto addLanguage(@RequestBody NewLanguage req) {
        languages.add(req.code(), req.nativeName(), req.englishName(), req.songsOnly());
        return get();
    }

    @PostMapping("/categories")
    public SettingsDto addCategory(@RequestBody CategoryRequest req) {
        if (req.kind() == null) {
            throw ApiException.badRequest("Say whether this is a prayer or song category.");
        }
        languages.addCategory(req.kind(), req.name());
        return get();
    }

    @PutMapping("/categories/{id}")
    public SettingsDto renameCategory(@PathVariable Long id, @RequestBody CategoryRequest req) {
        languages.renameCategory(id, req.name());
        return get();
    }

    @DeleteMapping("/categories/{id}")
    public SettingsDto deleteCategory(@PathVariable Long id) {
        long inUse = Stream.concat(
                        meta.categories(Category.Kind.PRAYER).stream(), meta.categories(Category.Kind.SONG).stream())
                .filter(c -> c.id().equals(id)).mapToLong(CategoryDto::count).sum();
        languages.deleteCategory(id, inUse);
        return get();
    }
}
