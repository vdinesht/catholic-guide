package org.catholicguide.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/** Turns a valid session cookie into an authenticated {@link PortalPrincipal}. */
@Component
public class SessionAuthenticationFilter extends OncePerRequestFilter {

    private final AuthService auth;
    private final SessionCookies cookies;

    public SessionAuthenticationFilter(AuthService auth, SessionCookies cookies) {
        this.auth = auth;
        this.cookies = cookies;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        cookies.read(request).flatMap(auth::userForToken).ifPresent(user -> {
            var principal = new PortalPrincipal(user.getId(), user.getName(), user.getRole());
            var authority = new SimpleGrantedAuthority("ROLE_" + user.getRole().name());
            var authentication = new UsernamePasswordAuthenticationToken(principal, null, List.of(authority));
            SecurityContextHolder.getContext().setAuthentication(authentication);
        });
        chain.doFilter(request, response);
    }
}
