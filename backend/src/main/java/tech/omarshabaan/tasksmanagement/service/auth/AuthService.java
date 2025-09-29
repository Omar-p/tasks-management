package tech.omarshabaan.tasksmanagement.service.auth;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import tech.omarshabaan.tasksmanagement.config.RefreshTokenProperties;
import tech.omarshabaan.tasksmanagement.dto.auth.UserSigninRequest;
import tech.omarshabaan.tasksmanagement.dto.auth.UserSigninResponse;
import tech.omarshabaan.tasksmanagement.dto.auth.UserSignupRequest;
import tech.omarshabaan.tasksmanagement.entity.RefreshToken;
import tech.omarshabaan.tasksmanagement.entity.UserSecurity;
import tech.omarshabaan.tasksmanagement.exception.InvalidRefreshTokenException;
import tech.omarshabaan.tasksmanagement.security.CustomUserDetails;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuthService {

	private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

	private final UserAuthService userAuthService;

	private final AuthenticationManager authenticationManager;

	private final JwtService jwtService;

	private final RefreshTokenService refreshTokenService;

	private final RefreshTokenProperties refreshTokenProperties;

	public AuthService(UserAuthService userAuthService, AuthenticationManager authenticationManager,
			JwtService jwtService, RefreshTokenService refreshTokenService, RefreshTokenProperties refreshTokenProperties) {
		this.userAuthService = userAuthService;
		this.authenticationManager = authenticationManager;
		this.jwtService = jwtService;
		this.refreshTokenService = refreshTokenService;
		this.refreshTokenProperties = refreshTokenProperties;
	}

	public void registerUser(UserSignupRequest request) {
		logger.info("Registering new user with email: {}", request.email());
		userAuthService.saveUserSecurity(request);
		logger.info("User registration completed for email: {}", request.email());
	}

	public UserSigninResponse authenticateUser(UserSigninRequest request, HttpServletResponse response) {
		logger.info("Authenticating user with email: {}", request.email());

		Authentication authentication = authenticationManager
			.authenticate(new UsernamePasswordAuthenticationToken(request.email(), request.password()));

		CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
		String accessToken = jwtService.generateAccessToken(userDetails);

		RefreshToken refreshToken = refreshTokenService.createRefreshToken(userDetails.getUserSecurity());
		setRefreshTokenCookie(response, refreshToken.getToken());

		logger.info("User authentication successful for email: {}, access token generated", request.email());
		return new UserSigninResponse(accessToken);
	}

	public UserSigninResponse refreshAccessToken(String refreshTokenValue, HttpServletResponse response) {
		logger.info("Refreshing access token");

		RefreshToken refreshToken = refreshTokenService.findByToken(refreshTokenValue)
			.orElseThrow(() -> new InvalidRefreshTokenException("Invalid refresh token"));

		refreshToken = refreshTokenService.verifyExpiration(refreshToken);

		UserSecurity userSecurity = refreshToken.getUser();

		List<String> authorities = userSecurity.getRoles()
			.stream()
			.flatMap(role -> role.getAuthorities().stream())
			.map(authority -> authority.getName().toString())
			.collect(Collectors.toList());

		userSecurity.getRoles().forEach(role -> authorities.add("ROLE_" + role.getName().toString()));

		String accessToken = jwtService.generateAccessToken(userSecurity, authorities);

		RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(userSecurity);
		setRefreshTokenCookie(response, newRefreshToken.getToken());

		logger.info("Access token refreshed successfully for user: {}", userSecurity.getEmail());
		return new UserSigninResponse(accessToken);
	}

	public void logoutUser(String refreshTokenValue, HttpServletResponse response) {
		if (refreshTokenValue == null || refreshTokenValue.trim().isEmpty()) {
			logger.warn("Logout attempt without refresh token");
			throw new InvalidRefreshTokenException("Refresh token is required for logout");
		}

		logger.info("Processing user logout");
		RefreshToken token = refreshTokenService.findByToken(refreshTokenValue)
			.orElseThrow(() -> new InvalidRefreshTokenException("Invalid refresh token"));

		refreshTokenService.revokeToken(token);
		logger.info("Refresh token revoked successfully for user: {}", token.getUser().getEmail());

		clearRefreshTokenCookie(response);
		logger.info("User logout completed successfully");
	}

	private void setRefreshTokenCookie(HttpServletResponse response, String tokenValue) {
		RefreshTokenProperties.Cookie cookieProps = refreshTokenProperties.cookie();
		Cookie refreshTokenCookie = new Cookie(cookieProps.name(), tokenValue);
		refreshTokenCookie.setHttpOnly(cookieProps.httpOnly());
		refreshTokenCookie.setSecure(cookieProps.secure());
		refreshTokenCookie.setPath("/");
		refreshTokenCookie.setMaxAge(cookieProps.maxAge());
		refreshTokenCookie.setAttribute("SameSite", cookieProps.sameSite());
		response.addCookie(refreshTokenCookie);
	}

	private void clearRefreshTokenCookie(HttpServletResponse response) {
		RefreshTokenProperties.Cookie cookieProps = refreshTokenProperties.cookie();
		Cookie refreshTokenCookie = new Cookie(cookieProps.name(), null);
		refreshTokenCookie.setHttpOnly(cookieProps.httpOnly());
		refreshTokenCookie.setSecure(cookieProps.secure());
		refreshTokenCookie.setPath("/");
		refreshTokenCookie.setMaxAge(0);
		response.addCookie(refreshTokenCookie);
	}

}