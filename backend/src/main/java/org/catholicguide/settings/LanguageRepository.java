package org.catholicguide.settings;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LanguageRepository extends JpaRepository<Language, String> {

    List<Language> findAllByOrderByPositionAsc();

    List<Language> findByEnabledTrueOrderByPositionAsc();
}
