package org.catholicguide;

import org.catholicguide.config.AppProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(AppProperties.class)
public class CatholicGuideApplication {

    public static void main(String[] args) {
        SpringApplication.run(CatholicGuideApplication.class, args);
    }
}
