package org.catholicguide.auth;

import java.util.Optional;
import org.catholicguide.users.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LoginCodeRepository extends JpaRepository<LoginCode, Long> {

    Optional<LoginCode> findFirstByUserOrderByCreatedAtDesc(User user);
}
