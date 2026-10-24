package org.catholicguide.activity;

import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ActivityRepository extends JpaRepository<Activity, Long> {

    @EntityGraph(attributePaths = "user")
    @Query("select a from Activity a order by a.at desc, a.id desc")
    List<Activity> latest(Pageable page);

    @EntityGraph(attributePaths = "user")
    @Query("select a from Activity a where lower(a.item) like lower(concat('%', :q, '%')) order by a.at desc, a.id desc")
    List<Activity> latestMatching(String q, Pageable page);
}
