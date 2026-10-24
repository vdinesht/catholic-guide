package org.catholicguide.readings;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class ReadingTextTest {

    private static ReadingSnapshot.Part part(String response, String body) {
        return new ReadingSnapshot.Part("First Reading", "Eph 4", "", response, body, "", "");
    }

    @Test
    void firstVerseOfNumberedText() {
        assertThat(ReadingText.firstLine(part("", "[7] But to every one of us is given grace. [8] Wherefore he saith.")))
                .isEqualTo("But to every one of us is given grace.");
    }

    @Test
    void responseWinsForPsalms() {
        assertThat(ReadingText.firstLine(part("Let us go rejoicing.", "[1] I rejoiced.")))
                .isEqualTo("R. Let us go rejoicing.");
    }

    @Test
    void acclamationSkipsTheAlleluias() {
        assertThat(ReadingText.firstLine(part("", "Alleluia, alleluia.\nI desire not the death of the wicked.\nAlleluia.")))
                .isEqualTo("I desire not the death of the wicked.");
    }
}
