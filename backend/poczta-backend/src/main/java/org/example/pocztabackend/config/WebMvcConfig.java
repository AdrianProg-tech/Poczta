package org.example.pocztabackend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final BridgeRoleAccessInterceptor bridgeRoleAccessInterceptor;

    public WebMvcConfig(BridgeRoleAccessInterceptor bridgeRoleAccessInterceptor) {
        this.bridgeRoleAccessInterceptor = bridgeRoleAccessInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(bridgeRoleAccessInterceptor)
                .addPathPatterns(
                        "/api/auth/me",
                        "/api/client/**",
                        "/api/courier/**",
                        "/api/point/**",
                        "/api/admin/**",
                        "/api/ops/**"
                );
    }
}
