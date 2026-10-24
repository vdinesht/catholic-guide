package org.catholicguide.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(
        String timezone,
        String siteUrl,
        List<String> corsOrigins,
        boolean sessionCookieSecure,
        Mail mail) {

    public record Mail(boolean enabled, String from) {}
}
