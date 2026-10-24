package org.catholicguide.readings;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ReadingSetRepository extends JpaRepository<ReadingSet, Long> {

    Optional<ReadingSet> findByDayAndLang(LocalDate day, String lang);

    @EntityGraph(attributePaths = "updatedBy")
    List<ReadingSet> findByDayOrderByLangAsc(LocalDate day);

    @Query("select r from ReadingSet r where r.day between :from and :to")
    List<ReadingSet> findRange(LocalDate from, LocalDate to);

    @Query("select r.lang from ReadingSet r where r.day = :day and r.publishedAt is not null")
    List<String> publishedLanguages(LocalDate day);

    @EntityGraph(attributePaths = "updatedBy")
    @Query("select r from ReadingSet r where r.publishedAt is null or r.hasChanges = true order by r.updatedAt desc")
    List<ReadingSet> findUnpublished();

    @Query(value = """
            select r.* from reading_sets r
            where r.published_at is not null and r.lang = :lang
              and exists (select 1 from jsonb_array_elements(r.published -> 'parts') p
                          where p ->> 'citation' ilike concat('%', :q, '%') or p ->> 'body' ilike concat('%', :q, '%'))
            order by r.day desc limit 20""", nativeQuery = true)
    List<ReadingSet> searchPublished(String lang, String q);
}
