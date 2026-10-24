package org.catholicguide.songs;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface SongRepository extends JpaRepository<Song, Long> {

    @EntityGraph(attributePaths = "updatedBy")
    @Query("select s from Song s order by s.updatedAt desc")
    List<Song> findAllForPortal();

    @Query("select s from Song s where s.publishedAt is not null order by s.category.position, s.title")
    List<Song> findPublished();

    Optional<Song> findBySlug(String slug);

    @EntityGraph(attributePaths = {"blocks", "updatedBy"})
    Optional<Song> findWithBlocksById(Long id);

    boolean existsBySlug(String slug);

    @EntityGraph(attributePaths = "updatedBy")
    @Query("select s from Song s where s.publishedAt is null or s.hasChanges = true order by s.updatedAt desc")
    List<Song> findUnpublished();
}
