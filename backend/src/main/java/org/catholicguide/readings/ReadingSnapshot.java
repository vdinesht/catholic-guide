package org.catholicguide.readings;

import java.util.List;

/** What visitors see for one day in one language: frozen at the moment it was published. */
public record ReadingSnapshot(String credit, String quote, String quoteCite, List<Part> parts) {

    public record Part(String kind, String citation, String intro, String response, String body,
                       String closeReader, String closePeople) {}
}
