package org.example.pocztabackend.config;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;
    private final CookieOAuth2AuthorizationRequestRepository cookieAuthRequestRepository;
    private final ClientRegistrationRepository clientRegistrationRepository;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    public SecurityConfig(OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler,
                          ObjectProvider<CookieOAuth2AuthorizationRequestRepository> cookieAuthRequestRepositoryProvider,
                          ObjectProvider<ClientRegistrationRepository> clientRegistrationRepositoryProvider) {
        this.oAuth2LoginSuccessHandler = oAuth2LoginSuccessHandler;
        this.cookieAuthRequestRepository = cookieAuthRequestRepositoryProvider.getIfAvailable();
        this.clientRegistrationRepository = clientRegistrationRepositoryProvider.getIfAvailable();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/**",
                                "/v3/api-docs", "/v3/api-docs/**",
                                "/swagger-resources", "/swagger-resources/**",
                                "/swagger-ui/**", "/swagger-ui.html",
                                "/error"
                        ).permitAll()
                        .anyRequest().authenticated()
                );

        if (clientRegistrationRepository != null && cookieAuthRequestRepository != null) {
            http.oauth2Login(oauth2 -> oauth2
                    .authorizationEndpoint(endpoint -> endpoint
                            .authorizationRequestRepository(cookieAuthRequestRepository)
                            .authorizationRequestResolver(promptSelectAccountResolver())
                    )
                    .failureUrl(frontendUrl + "/login?error=oauth2")
                    .successHandler(oAuth2LoginSuccessHandler)
            );
        }

        return http.build();
    }

    private OAuth2AuthorizationRequestResolver promptSelectAccountResolver() {
        DefaultOAuth2AuthorizationRequestResolver resolver =
                new DefaultOAuth2AuthorizationRequestResolver(
                        clientRegistrationRepository, "/oauth2/authorization");
        resolver.setAuthorizationRequestCustomizer(builder ->
                builder.additionalParameters(params -> params.put("prompt", "select_account"))
        );
        return resolver;
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return new InMemoryUserDetailsManager();
    }
}
