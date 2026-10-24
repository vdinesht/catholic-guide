package org.catholicguide.portal;

import java.util.List;
import org.catholicguide.activity.ActivityService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Admin only (see SecurityConfig). */
@RestController
@RequestMapping("/api/portal/activity")
public class ActivityController {

    private final ActivityService activity;

    public ActivityController(ActivityService activity) {
        this.activity = activity;
    }

    @GetMapping
    public List<ActivityService.Entry> list(@RequestParam(required = false) String q,
                                            @RequestParam(defaultValue = "200") int limit) {
        return activity.latest(Math.min(Math.max(limit, 1), 500), q);
    }
}
