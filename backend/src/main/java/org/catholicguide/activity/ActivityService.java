package org.catholicguide.activity;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import org.catholicguide.auth.CurrentUser;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ActivityService {

    private final ActivityRepository repo;
    private final CurrentUser currentUser;
    private final Clock clock;

    public ActivityService(ActivityRepository repo, CurrentUser currentUser, Clock clock) {
        this.repo = repo;
        this.currentUser = currentUser;
        this.clock = clock;
    }

    public record Entry(Long id, Instant at, String who, String what, String item) {
        static Entry of(Activity a) {
            return new Entry(a.getId(), a.getAt(), a.getUser() == null ? "Someone" : a.getUser().getName(), a.getVerb(), a.getItem());
        }
    }

    /** Records "<signed-in user> <verb> <item>", e.g. "Arul Raj published Readings · 24 Oct (தமிழ்)". */
    @Transactional
    public void record(String verb, String item) {
        repo.save(new Activity(Instant.now(clock), currentUser.entity(), verb, item));
    }

    @Transactional(readOnly = true)
    public List<Entry> latest(int limit, String query) {
        PageRequest page = PageRequest.of(0, limit);
        List<Activity> rows = (query == null || query.isBlank()) ? repo.latest(page) : repo.latestMatching(query.trim(), page);
        return rows.stream().map(Entry::of).toList();
    }
}
