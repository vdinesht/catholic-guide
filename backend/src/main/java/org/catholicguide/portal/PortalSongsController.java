package org.catholicguide.portal;

import java.util.List;
import org.catholicguide.portal.PortalDtos.SongDetail;
import org.catholicguide.portal.PortalDtos.SongRow;
import org.catholicguide.songs.Song;
import org.catholicguide.songs.SongService;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/portal/songs")
public class PortalSongsController {

    private final SongService songs;

    public PortalSongsController(SongService songs) {
        this.songs = songs;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<SongRow> list() {
        return songs.all().stream().map(s -> new SongRow(s.getId(), s.getTitle(), s.getCategory().getName(), s.getLang(),
                s.status(), s.getRights().name(), PortalDtos.who(s.getUpdatedBy()), s.getUpdatedAt())).toList();
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public SongDetail get(@PathVariable Long id) {
        return detail(songs.require(id));
    }

    @PostMapping
    @Transactional
    public SongDetail create(@RequestBody SongService.Edit edit) {
        return detail(songs.create(edit));
    }

    @PutMapping("/{id}")
    @Transactional
    public SongDetail save(@PathVariable Long id, @RequestBody SongService.Edit edit) {
        return detail(songs.saveDraft(id, edit));
    }

    @PostMapping("/{id}/publish")
    @Transactional
    public SongDetail publish(@PathVariable Long id, @RequestBody(required = false) SongService.Edit edit) {
        return detail(songs.publish(id, edit));
    }

    @PostMapping("/{id}/unpublish")
    @Transactional
    public SongDetail unpublish(@PathVariable Long id) {
        return detail(songs.unpublish(id));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        songs.delete(id);
        return ResponseEntity.noContent().build();
    }

    private static SongDetail detail(Song s) {
        return new SongDetail(s.getId(), s.getSlug(), s.getLang(), s.getCategory().getId(), s.getRights().name(),
                s.getLicenceNumber(), s.working(), s.status(), PortalDtos.who(s.getUpdatedBy()), s.getUpdatedAt());
    }
}
