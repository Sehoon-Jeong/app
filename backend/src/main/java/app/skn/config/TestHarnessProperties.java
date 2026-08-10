package app.skn.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.test-harness")
public record TestHarnessProperties(boolean enabled) {
}
