package org.catholicguide.auth;

import org.catholicguide.common.ApiException;
import org.catholicguide.users.User;
import org.catholicguide.users.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class CurrentUser {

    private final UserRepository users;

    public CurrentUser(UserRepository users) {
        this.users = users;
    }

    public PortalPrincipal principal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof PortalPrincipal p)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Please sign in.");
        }
        return p;
    }

    /** The managed entity, for use inside a transaction (e.g. as "updated by"). */
    public User entity() {
        return users.getReferenceById(principal().userId());
    }
}
