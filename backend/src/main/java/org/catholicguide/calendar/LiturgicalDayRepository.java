package org.catholicguide.calendar;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface LiturgicalDayRepository extends JpaRepository<LiturgicalDay, LocalDate> {

    @EntityGraph(attributePaths = "names")
    @Query("select d from LiturgicalDay d where d.day between :from and :to order by d.day")
    List<LiturgicalDay> findRange(LocalDate from, LocalDate to);

    @EntityGraph(attributePaths = "names")
    @Query("select d from LiturgicalDay d where d.highlight = true and d.day > :after order by d.day")
    List<LiturgicalDay> findHighlightsAfter(LocalDate after, Pageable page);
}
