package tech.omarshabaan.tasksmanagement.config;

import org.springframework.boot.autoconfigure.security.servlet.PathRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import tech.omarshabaan.tasksmanagement.security.DelegatedAccessDeniedHandler;
import tech.omarshabaan.tasksmanagement.security.DelegatedAuthenticationEntryPoint;
import tech.omarshabaan.tasksmanagement.security.JwtToUserAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.nimbusds.jose.jwk.JWK;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;

import java.util.Arrays;

@Configuration
public class SecurityConfig {

	private final RsaKeyProperties rsaKeys;

	private final JwtToUserAuthenticationConverter jwtToUserAuthenticationConverter;

	private final CorsProperties corsProperties;

	private final DelegatedAuthenticationEntryPoint delegatedAuthenticationEntryPoint;

	private final DelegatedAccessDeniedHandler delegatedAccessDeniedHandler;

	public SecurityConfig(RsaKeyProperties rsaKeys, JwtToUserAuthenticationConverter jwtToUserAuthenticationConverter,
			CorsProperties corsProperties, DelegatedAuthenticationEntryPoint delegatedAuthenticationEntryPoint,
			DelegatedAccessDeniedHandler delegatedAccessDeniedHandler) {
		this.rsaKeys = rsaKeys;
		this.jwtToUserAuthenticationConverter = jwtToUserAuthenticationConverter;
		this.corsProperties = corsProperties;
		this.delegatedAuthenticationEntryPoint = delegatedAuthenticationEntryPoint;
		this.delegatedAccessDeniedHandler = delegatedAccessDeniedHandler;
	}

	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	public AuthenticationProvider authenticationProvider(UserDetailsService userDetailsService,
			PasswordEncoder passwordEncoder) {
		DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(userDetailsService);
		authProvider.setPasswordEncoder(passwordEncoder);
		return authProvider;
	}

	@Bean
	public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
		return config.getAuthenticationManager();
	}

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		return http.csrf(AbstractHttpConfigurer::disable)
			.cors(cors -> cors.configurationSource(corsConfigurationSource()))
			.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
			.exceptionHandling(exceptions -> exceptions.accessDeniedHandler(delegatedAccessDeniedHandler))
			.authorizeHttpRequests(auth -> auth.requestMatchers(HttpMethod.POST, "/api/auth/signup")
				.permitAll()
				.requestMatchers(HttpMethod.POST, "/api/auth/signin")
				.permitAll() //
				.requestMatchers(HttpMethod.POST, "/api/auth/refresh")
				.permitAll() //
				.requestMatchers(HttpMethod.POST, "/api/auth/logout")
				.permitAll() //
				.requestMatchers(HttpMethod.GET, "/docs.html")
				.permitAll() //
				.requestMatchers(PathRequest.toStaticResources().atCommonLocations())
				.permitAll() //
				.requestMatchers("/actuator/health")
				.permitAll() //
				.requestMatchers("/actuator/info")
				.permitAll() //
				.anyRequest()
				.authenticated())
			.oauth2ResourceServer(oauth2 -> oauth2.authenticationEntryPoint(delegatedAuthenticationEntryPoint)
				.jwt(jwt -> jwt.decoder(jwtDecoder()).jwtAuthenticationConverter(jwtToUserAuthenticationConverter)))
			.build();
	}

	@Bean
	public CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration configuration = new CorsConfiguration();
		configuration.setAllowedOriginPatterns(corsProperties.allowedOrigins());
		configuration.setAllowedMethods(Arrays.asList("*"));
		configuration.setAllowedHeaders(Arrays.asList("*"));
		configuration.setAllowCredentials(true);
		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", configuration);
		return source;
	}

	@Bean
	public JwtDecoder jwtDecoder() {
		return NimbusJwtDecoder.withPublicKey(rsaKeys.publicKey()).build();
	}

	@Bean
	public JwtEncoder jwtEncoder() {
		JWK jwk = new RSAKey.Builder(rsaKeys.publicKey()).privateKey(rsaKeys.privateKey()).build();
		JWKSource<SecurityContext> jwks = new ImmutableJWKSet<>(new JWKSet(jwk));
		return new NimbusJwtEncoder(jwks);
	}

	@Bean
	public JwtAuthenticationConverter jwtAuthenticationConverter() {
		JwtGrantedAuthoritiesConverter jwtGrantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
		jwtGrantedAuthoritiesConverter.setAuthoritiesClaimName("authorities");
		jwtGrantedAuthoritiesConverter.setAuthorityPrefix("");

		JwtAuthenticationConverter jwtConverter = new JwtAuthenticationConverter();
		jwtConverter.setJwtGrantedAuthoritiesConverter(jwtGrantedAuthoritiesConverter);
		return jwtConverter;
	}

}
