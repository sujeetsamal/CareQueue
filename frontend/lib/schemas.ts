import { z } from "zod";

export const registerPatientSchema = z.object({
  name: z
    .string()
    .min(1, "Patient name is required.")
    .refine((val) => val.trim().length >= 2, {
      message: "Patient name must be at least 2 characters.",
    })
    .refine((val) => val.trim().length <= 100, {
      message: "Patient name cannot exceed 100 characters.",
    }),
  department: z.string().min(1, "Please select a department."),
  age: z
    .union([z.string(), z.number()])
    .optional()
    .refine(
      (val) => {
        if (val === "" || val === undefined || val === null) return true;
        const num = Number(val);
        return !isNaN(num) && num >= 0 && num <= 130;
      },
      { message: "Age must be between 0 and 130 years." }
    ),
  notes: z
    .string()
    .max(250, "Visit notes cannot exceed 250 characters.")
    .optional(),
});

export type RegisterPatientFormValues = z.infer<typeof registerPatientSchema>;
