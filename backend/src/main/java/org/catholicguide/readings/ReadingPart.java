package org.catholicguide.readings;

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
@Table(name = "reading_parts")
public class ReadingPart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reading_set_id")
    private ReadingSet readingSet;

    private int position;

    @Column(nullable = false)
    private String kind;

    @Column(nullable = false)
    private String citation = "";

    @Column(nullable = false)
    private String intro = "";

    @Column(nullable = false)
    private String response = "";

    @Column(nullable = false)
    private String body = "";

    @Column(nullable = false)
    private String closeReader = "";

    @Column(nullable = false)
    private String closePeople = "";

    protected ReadingPart() {}

    ReadingPart(ReadingSet readingSet, int position, ReadingSnapshot.Part p) {
        this.readingSet = readingSet;
        this.position = position;
        this.kind = p.kind();
        this.citation = nz(p.citation());
        this.intro = nz(p.intro());
        this.response = nz(p.response());
        this.body = nz(p.body());
        this.closeReader = nz(p.closeReader());
        this.closePeople = nz(p.closePeople());
    }

    public int getPosition() { return position; }

    ReadingSnapshot.Part toSnapshot() {
        return new ReadingSnapshot.Part(kind, citation, intro, response, body, closeReader, closePeople);
    }

    private static String nz(String s) {
        return s == null ? "" : s.strip();
    }
}
