import { z } from 'zod';

// Basic validation for immediate feedback
const passwordPolicySchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
  .regex(/^(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
  .regex(/^(?=.*\d)/, 'Password must contain at least one number')
  .regex(/^(?=.*[@$!%*?&])/, 'Password must contain at least one special character');

// Auth schemas matching backend validation
export const signupSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    email: z
      .email('Please enter a valid email address'),
    password: passwordPolicySchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const signinSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

export type SignupFormData = z.infer<typeof signupSchema>;
export type SigninFormData = z.infer<typeof signinSchema>;

// Task schemas
export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters'),
  description: z
    .string()
    .min(1, 'Description is required'),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).superRefine((val, ctx) => {
    if (!val) ctx.addIssue({ code: "custom", message: "Priority is required" });
  }),
  dueDate: z.date().refine((date) => !!date, {
    message: "Due date is required",
  }).refine((date) => date > new Date(), {
    message: "Due date must be in the future",
  }),
});

export type CreateTaskFormData = z.infer<typeof createTaskSchema>;
