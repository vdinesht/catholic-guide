package org.catholicguide.auth;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Duration;
import java.util.Arrays;
import java.util.Optional;
import org.catholicguide.config.AppProperties;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

/**
 * The session lives in an HttpOnly, SameSite=Strict cookie. Strict means the browser never
 * attaches it to a request started from another site, which is what protects the portal's
 * write endpoints from cross-site request forgery.
 */
@Component
public class SessionCookies {

    static final String NAME = "cg_session";

    private final AppProperties props;

    public SessionCookies(AppProperties props) {
        this.props = props;
    }

    public Optional<String> read(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return Optional.empty();
        }
        return Arrays.stream(cookies)
                .filter(c -> NAME.equals(c.getName()) && !c.getValue().isBlank())
                .map(Cookie::getValue)
                .findFirst();
    }

    public ResponseCookie create(String token, Duration lifetime) {
        return base(token).maxAge(lifetime).build();
    }

    public ResponseCookie clear() {
        return base("").maxAge(0).build();
    }

    private ResponseCookie.ResponseCookieBuilder base(String value) {
        return ResponseCookie.from(NAME, value)
                .httpOnly(true)
                .secure(props.sessionCookieSecure())
                .sameSite("Strict")
                .path("/api");
    }
}
