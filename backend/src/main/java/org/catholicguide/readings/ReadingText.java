package org.catholicguide.readings;

import java.util.regex.Pattern;

/**
 * Reading bodies are plain text: verse numbers in square brackets ("[7] But to every one…"),
 * a blank line between paragraphs.
 */
public final class ReadingText {

    private static final Pattern VERSE = Pattern.compile("\\[(\\w{1,4})\\]\\s*");
    private static final Pattern ALLELUIA = Pattern.compile("^(alleluia[,!.]?\\s*){1,3}", Pattern.CASE_INSENSITIVE);

    private ReadingText() {}

    /** A one-line taste of a reading for lists: the response for psalms, otherwise the first verse. */
    public static String firstLine(ReadingSnapshot.Part p) {
        if (!p.response().isBlank()) {
            return "R. " + p.response();
        }
        String body = p.body().strip();
        if (body.startsWith("[")) {
            String[] verses = VERSE.split(body);
            for (String v : verses) {
                if (!v.isBlank()) {
                    return v.strip().replaceAll("\\s+", " ");
                }
            }
        }
        String plain = ALLELUIA.matcher(body).replaceFirst("").strip();
        int end = plain.indexOf('\n');
        return (end > 0 ? plain.substring(0, end) : plain).strip();
    }
}
