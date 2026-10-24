package org.catholicguide.songs;

import java.util.List;

/** The lyrics visitors see, frozen at the moment the song was published. */
public record SongSnapshot(String title, String author, String tune, List<Block> blocks) {

    public record Block(String type, String body) {}
}
