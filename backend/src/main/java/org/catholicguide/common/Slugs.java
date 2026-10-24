package org.catholicguide.common;

import java.text.Normalizer;
import java.util.Locale;
import java.util.function.Predicate;

public final class Slugs {

    private Slugs() {}

    /** "Prayer to St. Michael" → "prayer-to-st-michael"; non-Latin titles fall back to {@code fallback}. */
    public static String of(String title, String fallback) {
        String ascii = Normalizer.normalize(title, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        String slug = ascii.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
        if (slug.length() > 100) {
            slug = slug.substring(0, 100).replaceAll("-$", "");
        }
        return slug.isEmpty() ? fallback : slug;
    }

    /** Appends -2, -3… until {@code taken} says the slug is free. */
    public static String unique(String base, Predicate<String> taken) {
        String slug = base;
        for (int n = 2; taken.test(slug); n++) {
            slug = base + "-" + n;
        }
        return slug;
    }
}
