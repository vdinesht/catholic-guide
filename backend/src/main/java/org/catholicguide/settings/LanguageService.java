package org.catholicguide.settings;

import java.util.List;
import java.util.Locale;
import org.catholicguide.activity.ActivityService;
import org.catholicguide.categories.Category;
import org.catholicguide.categories.CategoryRepository;
import org.catholicguide.common.ApiException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Admin changes to languages and categories. */
@Service
public class LanguageService {

    private final LanguageRepository languages;
    private final CategoryRepository categories;
    private final ActivityService activity;

    public LanguageService(LanguageRepository languages, CategoryRepository categories, ActivityService activity) {
        this.languages = languages;
        this.categories = categories;
        this.activity = activity;
    }

    @Transactional(readOnly = true)
    public List<Language> all() {
        return languages.findAllByOrderByPositionAsc();
    }

    @Transactional
    public Language setEnabled(String code, boolean enabled) {
        Language l = languages.findById(code).orElseThrow(() -> ApiException.notFound("Language"));
        if (l.isDefault() && !enabled) {
            throw ApiException.badRequest(l.getEnglishName() + " is the default language and can't be turned off.");
        }
        if (l.isEnabled() != enabled) {
            l.setEnabled(enabled);
            activity.record(enabled ? "turned on" : "turned off", "the " + l.getEnglishName() + " language");
        }
        return l;
    }

    @Transactional
    public Language add(String rawCode, String nativeName, String englishName, boolean songsOnly) {
        String code = rawCode == null ? "" : rawCode.strip().toLowerCase(Locale.ROOT);
        if (!code.matches("[a-z]{2,3}(-[a-z0-9]{2,8})?")) {
            throw ApiException.badRequest("Use a language code such as “ml” or “pt-br”.");
        }
        if (languages.existsById(code)) {
            throw ApiException.conflict("That language is already in the list.");
        }
        if (nativeName == null || nativeName.isBlank() || englishName == null || englishName.isBlank()) {
            throw ApiException.badRequest("Enter the language's own name and its English name.");
        }
        int position = languages.findAllByOrderByPositionAsc().stream().mapToInt(Language::getPosition).max().orElse(-1) + 1;
        Language l = new Language(code, nativeName.strip(), englishName.strip(), position);
        l.setSongsOnly(songsOnly);
        languages.save(l);
        activity.record("added", "the " + l.getEnglishName() + " language");
        return l;
    }

    @Transactional
    public Category addCategory(Category.Kind kind, String name) {
        String n = name == null ? "" : name.strip();
        if (n.isEmpty() || n.length() > 80) {
            throw ApiException.badRequest("Category names need 1–80 characters.");
        }
        if (categories.findByKindAndNameIgnoreCase(kind, n).isPresent()) {
            throw ApiException.conflict("“" + n + "” is already a category.");
        }
        Category c = categories.save(new Category(kind, n, categories.nextPosition(kind)));
        activity.record("added the category", n);
        return c;
    }

    @Transactional
    public Category renameCategory(Long id, String name) {
        Category c = categories.findById(id).orElseThrow(() -> ApiException.notFound("Category"));
        String n = name == null ? "" : name.strip();
        if (n.isEmpty() || n.length() > 80) {
            throw ApiException.badRequest("Category names need 1–80 characters.");
        }
        categories.findByKindAndNameIgnoreCase(c.getKind(), n)
                .filter(other -> !other.getId().equals(id))
                .ifPresent(other -> { throw ApiException.conflict("“" + n + "” is already a category."); });
        String old = c.getName();
        c.setName(n);
        activity.record("renamed the category", old + " to " + n);
        return c;
    }

    @Transactional
    public void deleteCategory(Long id, long inUse) {
        Category c = categories.findById(id).orElseThrow(() -> ApiException.notFound("Category"));
        if (inUse > 0) {
            throw ApiException.conflict("“" + c.getName() + "” is in use, so it can't be deleted. Move its items first.");
        }
        categories.delete(c);
        activity.record("deleted the category", c.getName());
    }
}
