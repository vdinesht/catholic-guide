package org.catholicguide.auth;

import java.time.Instant;
import org.catholicguide.users.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface SessionRepository extends JpaRepository<Session, String> {

    @Modifying
    @Query("delete from Session s where s.user = :user")
    void deleteAllForUser(User user);

    @Modifying
    @Query("delete from Session s where s.expiresAt < :now")
    void deleteExpired(Instant now);
}
