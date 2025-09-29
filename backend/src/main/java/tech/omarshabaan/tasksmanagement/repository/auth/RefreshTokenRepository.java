package tech.omarshabaan.tasksmanagement.repository.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import tech.omarshabaan.tasksmanagement.entity.RefreshToken;
import tech.omarshabaan.tasksmanagement.entity.UserSecurity;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

	Optional<RefreshToken> findByToken(String token);

	List<RefreshToken> findByUser(UserSecurity user);

	@Modifying
	@Query("DELETE FROM RefreshToken rt WHERE rt.user = :user")
	void deleteByUser(@Param("user") UserSecurity user);

	@Modifying
	@Query("DELETE FROM RefreshToken rt WHERE rt.expiryDate <= :now")
	int deleteExpiredTokens(@Param("now") Instant now);

	@Modifying
	@Query("UPDATE RefreshToken rt SET rt.revoked = true WHERE rt.user = :user")
	void revokeAllByUser(@Param("user") UserSecurity user);

}