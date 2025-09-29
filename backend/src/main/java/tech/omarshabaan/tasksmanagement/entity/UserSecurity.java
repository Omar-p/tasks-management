package tech.omarshabaan.tasksmanagement.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import com.fasterxml.uuid.Generators;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "user_security",
		uniqueConstraints = { @UniqueConstraint(name = "user_security_email_key", columnNames = "email") })
public class UserSecurity extends BaseEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "user_security_id_seq")
	@SequenceGenerator(name = "user_security_id_seq", sequenceName = "user_security_id_seq", allocationSize = 1)
	private Long id;

	@Column(nullable = false, unique = true, updatable = false)
	private UUID uuid;

	@Column(nullable = false)
	private String email;

	@Column(nullable = false)
	private String password;

	@Column(nullable = false)
	private boolean locked;

	@Column(nullable = false)
	private boolean enabled;

	@ManyToMany(fetch = FetchType.EAGER)
	@JoinTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"),
			inverseJoinColumns = @JoinColumn(name = "role_id"))
	private Set<Role> roles = new HashSet<>();

	@PrePersist
	public void generateUuid() {
		if (this.uuid == null) {
			this.uuid = Generators.timeBasedEpochGenerator().generate();
		}
	}

	protected UserSecurity() {
	}

	private UserSecurity(Builder builder) {
		this.id = builder.id;
		this.uuid = builder.uuid;
		this.email = builder.email;
		this.password = builder.password;
		this.locked = builder.locked;
		this.enabled = builder.enabled;
		this.roles = builder.roles;
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public UUID getUuid() {
		return uuid;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}

	public boolean isLocked() {
		return locked;
	}

	public void setLocked(boolean locked) {
		this.locked = locked;
	}

	public boolean isEnabled() {
		return enabled;
	}

	public void setEnabled(boolean enabled) {
		this.enabled = enabled;
	}

	public Set<Role> getRoles() {
		return roles;
	}

	public void setRoles(Set<Role> roles) {
		this.roles = roles;
	}

	public void addRole(Role role) {
		this.roles.add(role);
		role.getUsers().add(this);
	}

	public void removeRole(Role role) {
		this.roles.remove(role);
		role.getUsers().remove(this);
	}

	public static class Builder {

		private Long id;

		private UUID uuid;

		private String email;

		private String password;

		private boolean locked;

		private boolean enabled;

		private Set<Role> roles = new HashSet<>();

		public Builder id(Long id) {
			this.id = id;
			return this;
		}

		public Builder uuid(UUID uuid) {
			this.uuid = uuid;
			return this;
		}

		public Builder email(String email) {
			this.email = email;
			return this;
		}

		public Builder password(String password) {
			this.password = password;
			return this;
		}

		public Builder locked(boolean locked) {
			this.locked = locked;
			return this;
		}

		public Builder enabled(boolean enabled) {
			this.enabled = enabled;
			return this;
		}

		public Builder roles(Set<Role> roles) {
			this.roles = roles;
			return this;
		}

		public Builder addRole(Role role) {
			this.roles.add(role);
			return this;
		}

		public UserSecurity build() {
			return new UserSecurity(this);
		}

	}

	@Override
	public boolean equals(Object o) {
		if (this == o) return true;

		if (!(o instanceof UserSecurity))
			return false;

		UserSecurity other = (UserSecurity) o;

		return uuid != null &&
			uuid.equals(other.getUuid());
	}

	@Override
	public int hashCode() {
		return uuid != null ? uuid.hashCode() : 0;
	}

}
