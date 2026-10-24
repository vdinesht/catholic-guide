package org.catholicguide.songs;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "song_blocks")
public class SongBlock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "song_id")
    private Song song;

    private int position;

    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private String body = "";

    protected SongBlock() {}

    SongBlock(Song song, int position, String type, String body) {
        this.song = song;
        this.position = position;
        this.type = type;
        this.body = body;
    }

    SongSnapshot.Block toSnapshot() {
        return new SongSnapshot.Block(type, body);
    }
}
