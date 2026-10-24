package org.catholicguide.categories;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findByKindOrderByPositionAsc(Category.Kind kind);

    Optional<Category> findByKindAndNameIgnoreCase(Category.Kind kind, String name);

    @Query("select coalesce(max(c.position), -1) + 1 from Category c where c.kind = :kind")
    int nextPosition(Category.Kind kind);

    @Query("""
            select c.id, count(p.id) from Category c left join Prayer p on p.category = c
            where c.kind = org.catholicguide.categories.Category.Kind.PRAYER group by c.id""")
    List<Object[]> prayerCounts();

    @Query("""
            select c.id, count(s.id) from Category c left join Song s on s.category = c
            where c.kind = org.catholicguide.categories.Category.Kind.SONG group by c.id""")
    List<Object[]> songCounts();
}
