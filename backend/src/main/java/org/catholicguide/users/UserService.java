package org.catholicguide.users;

import java.util.List;
import java.util.Locale;
import org.catholicguide.activity.ActivityService;
import org.catholicguide.auth.CurrentUser;
import org.catholicguide.auth.MailService;
import org.catholicguide.auth.SessionRepository;
import org.catholicguide.common.ApiException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository users;
    private final SessionRepository sessions;
    private final MailService mail;
    private final ActivityService activity;
    private final CurrentUser currentUser;

    public UserService(UserRepository users, SessionRepository sessions, MailService mail, ActivityService activity,
                       CurrentUser currentUser) {
        this.users = users;
        this.sessions = sessions;
        this.mail = mail;
        this.activity = activity;
        this.currentUser = currentUser;
    }

    @Transactional(readOnly = true)
    public List<User> all() {
        return users.findAllByOrderByCreatedAtAsc();
    }

    @Transactional
    public User invite(String name, String rawEmail, User.Role role) {
        if (name == null || name.isBlank()) {
            throw ApiException.badRequest("Enter the person's name.");
        }
        if (rawEmail == null || !rawEmail.strip().matches("[^@\\s]+@[^@\\s]+\\.[^@\\s]+")) {
            throw ApiException.badRequest("Enter a valid email address.");
        }
        String email = rawEmail.strip().toLowerCase(Locale.ROOT);
        if (users.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict(email + " already has portal access.");
        }
        User u = users.save(new User(name.strip(), email, role == null ? User.Role.EDITOR : role, User.Status.INVITED));
        mail.sendInvite(u.getEmail(), u.getName(), currentUser.principal().name());
        activity.record("invited", u.getName() + " as " + label(u.getRole()));
        return u;
    }

    @Transactional
    public User resendInvite(Long id) {
        User u = require(id);
        if (u.getStatus() != User.Status.INVITED) {
            throw ApiException.badRequest(u.getName() + " has already signed in.");
        }
        mail.sendInvite(u.getEmail(), u.getName(), currentUser.principal().name());
        return u;
    }

    @Transactional
    public User update(Long id, User.Role role, User.Status status) {
        User u = require(id);
        if (u.getId().equals(currentUser.principal().userId())) {
            throw ApiException.forbidden("You can't change your own role or access.");
        }
        boolean removesAdmin = u.isAdmin() && u.getStatus() == User.Status.ACTIVE
                && ((role != null && role != User.Role.ADMIN) || status == User.Status.DEACTIVATED);
        if (removesAdmin && users.countByRoleAndStatus(User.Role.ADMIN, User.Status.ACTIVE) <= 1) {
            throw ApiException.conflict("The portal needs at least one active admin.");
        }
        if (role != null && role != u.getRole()) {
            u.setRole(role);
            activity.record("changed the role of", u.getName() + " to " + label(role));
        }
        if (status != null && status != u.getStatus()) {
            if (status == User.Status.INVITED) {
                throw ApiException.badRequest("Use “Resend invite” instead.");
            }
            if (status == User.Status.DEACTIVATED) {
                sessions.deleteAllForUser(u);
                activity.record("deactivated", u.getName());
            } else {
                activity.record("reactivated", u.getName());
            }
            // Someone reactivated before their first sign-in is still only invited.
            u.setStatus(status == User.Status.ACTIVE && u.getLastSignInAt() == null ? User.Status.INVITED : status);
        }
        return u;
    }

    private User require(Long id) {
        return users.findById(id).orElseThrow(() -> ApiException.notFound("User"));
    }

    private static String label(User.Role role) {
        return role == User.Role.ADMIN ? "Admin" : "Editor";
    }
}
