import { signupSchema } from "@/lib/validation";

interface PasswordRequirementsProps {
  password: string;
}

export const PasswordRequirements = ({ password }: PasswordRequirementsProps) => {
  const passwordSchema = signupSchema.shape.password;
  const result = passwordSchema.safeParse(password);

  // Extract which specific validation rules failed
  const failedChecks = result.success
    ? []
    : result.error.issues.map((issue) => issue.message);

  const requirements = [
    {
      text: "At least 8 characters",
      met: !failedChecks.some((msg) => msg.includes("8 characters")),
    },
    {
      text: "Contains lowercase letter",
      met: !failedChecks.some((msg) => msg.includes("lowercase")),
    },
    {
      text: "Contains uppercase letter",
      met: !failedChecks.some((msg) => msg.includes("uppercase")),
    },
    {
      text: "Contains a number",
      met: !failedChecks.some((msg) => msg.includes("number")),
    },
    {
      text: "Contains special character",
      met: !failedChecks.some((msg) => msg.includes("special")),
    },
  ];

  return (
    <div className="text-sm bg-surface rounded-lg p-4 border mt-3">
      <p className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
        Password requirements:
      </p>
      <ul className="text-xs space-y-2">
        {requirements.map((req, index) => (
          <li
            key={index}
            className={`flex items-center gap-2 transition-colors duration-200`}
            style={{
              color: req.met ? 'var(--color-success)' : 'var(--color-text-secondary)'
            }}
          >
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-200`}
              style={{
                backgroundColor: req.met ? 'var(--color-success)' : '#6b7280',
                color: req.met ? 'white' : '#9ca3af'
              }}
            >
              {req.met ? "✓" : "○"}
            </span>
            {req.text}
          </li>
        ))}
      </ul>
    </div>
  );
};