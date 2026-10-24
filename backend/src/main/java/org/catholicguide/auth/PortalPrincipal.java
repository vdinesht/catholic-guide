package org.catholicguide.auth;

import org.catholicguide.users.User;

/** The signed-in portal user, as kept in the security context for one request. */
public record PortalPrincipal(Long userId, String name, User.Role role) {

    public boolean isAdmin() {
        return role == User.Role.ADMIN;
    }
}
