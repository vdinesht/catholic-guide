package org.catholicguide.settings;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.catholicguide.common.ApiException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SettingsService {

    public static final Set<Integer> CODE_EXPIRY_CHOICES = Set.of(5, 10, 15);
    public static final Set<Integer> SESSION_DAY_CHOICES = Set.of(1, 7, 14, 30);

    private static final String CODE_EXPIRY = "code_expiry_minutes";
    private static final String SESSION_DAYS = "session_days";
    private static final String ALLOWED_DOMAINS = "allowed_domains";

    private final SettingRepository settings;
    private final LanguageRepository languages;

    public SettingsService(SettingRepository settings, LanguageRepository languages) {
        this.settings = settings;
        this.languages = languages;
    }

    public record SignInSettings(int codeExpiryMinutes, int sessionDays, List<String> allowedDomains) {

        public boolean allows(String email) {
            if (allowedDomains.isEmpty()) {
                return true;
            }
            String domain = email.substring(email.lastIndexOf('@') + 1).toLowerCase(Locale.ROOT);
            return allowedDomains.contains(domain);
        }
    }

    @Transactional(readOnly = true)
    public SignInSettings signIn() {
        return new SignInSettings(
                Integer.parseInt(get(CODE_EXPIRY, "10")),
                Integer.parseInt(get(SESSION_DAYS, "14")),
                parseDomains(get(ALLOWED_DOMAINS, "")));
    }

    @Transactional
    public SignInSettings updateSignIn(int codeExpiryMinutes, int sessionDays, String allowedDomains) {
        if (!CODE_EXPIRY_CHOICES.contains(codeExpiryMinutes)) {
            throw ApiException.badRequest("Code expiry must be 5, 10 or 15 minutes.");
        }
        if (!SESSION_DAY_CHOICES.contains(sessionDays)) {
            throw ApiException.badRequest("Sessions can last 1, 7, 14 or 30 days.");
        }
        List<String> domains = parseDomains(allowedDomains == null ? "" : allowedDomains);
        for (String d : domains) {
            if (!d.matches("[a-z0-9.-]+\\.[a-z]{2,}")) {
                throw ApiException.badRequest("“" + d + "” isn't a valid email domain.");
            }
        }
        put(CODE_EXPIRY, String.valueOf(codeExpiryMinutes));
        put(SESSION_DAYS, String.valueOf(sessionDays));
        put(ALLOWED_DOMAINS, String.join(", ", domains));
        return signIn();
    }

    /** Languages that get readings and prayers (everything enabled except songs-only ones). */
    @Transactional(readOnly = true)
    public List<Language> contentLanguages() {
        return languages.findByEnabledTrueOrderByPositionAsc().stream().filter(l -> !l.isSongsOnly()).toList();
    }

    @Transactional(readOnly = true)
    public List<Language> enabledLanguages() {
        return languages.findByEnabledTrueOrderByPositionAsc();
    }

    @Transactional(readOnly = true)
    public Language requireEnabled(String code) {
        return languages.findById(code).filter(Language::isEnabled)
                .orElseThrow(() -> ApiException.badRequest("Language “" + code + "” isn't turned on."));
    }

    private String get(String key, String fallback) {
        return settings.findById(key).map(Setting::getValue).orElse(fallback);
    }

    private void put(String key, String value) {
        Setting s = settings.findById(key).orElseGet(() -> new Setting(key, value));
        s.setValue(value);
        settings.save(s);
    }

    private static List<String> parseDomains(String raw) {
        return Arrays.stream(raw.split("[,\\s]+"))
                .map(s -> s.trim().toLowerCase(Locale.ROOT).replaceFirst("^@", ""))
                .filter(s -> !s.isEmpty())
                .distinct()
                .toList();
    }
}
