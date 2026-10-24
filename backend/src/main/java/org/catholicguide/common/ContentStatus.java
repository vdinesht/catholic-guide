package org.catholicguide.common;

import java.time.Instant;

/**
 * Where one translation of a reading, prayer or song stands.
 * CHANGES means it is live, but the working copy has edits that are not published yet.
 */
public enum ContentStatus {
    MISSING, DRAFT, PUBLISHED, CHANGES;

    public static ContentStatus of(boolean exists, Instant publishedAt, boolean hasChanges) {
        if (!exists) {
            return MISSING;
        }
        if (publishedAt == null) {
            return DRAFT;
        }
        return hasChanges ? CHANGES : PUBLISHED;
    }

    public boolean isLive() {
        return this == PUBLISHED || this == CHANGES;
    }
}
