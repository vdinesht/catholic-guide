package org.catholicguide.prayers;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface PrayerRepository extends JpaRepository<Prayer, Long> {

    @EntityGraph(attributePaths = {"translations", "updatedBy"})
    @Query("select distinct p from Prayer p order by p.updatedAt desc")
    List<Prayer> findAllWithTranslations();

    @EntityGraph(attributePaths = {"translations", "updatedBy"})
    Optional<Prayer> findBySlug(String slug);

    @EntityGraph(attributePaths = {"translations", "updatedBy"})
    Optional<Prayer> findWithTranslationsById(Long id);

    boolean existsBySlug(String slug);
}
