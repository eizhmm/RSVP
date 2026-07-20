import { z } from "zod";

const phoneSchema = z
  .string()
  .trim()
  .min(1, "Phone is required")
  .refine((value) => {
    const digits = value.replace(/\D/g, "");
    return digits.length >= 8 && digits.length <= 15;
  }, "Enter a valid phone number");

const guestSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Name is required")
    .refine((v) => v.length >= 2, "Enter your full name"),
  phone: phoneSchema,
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email"),
  designation: z
    .string()
    .trim()
    .min(1, "Designation is required")
    .refine((v) => v.length >= 2, "Enter a designation"),
  dietaryNote: z.string().trim().optional(),
});

export const bookingSchema = z
  .object({
    slotKey: z.string().min(1, "Please choose a sitting"),
    pax: z.number().int().min(1).max(30),
    lead: guestSchema,
    companions: z.array(guestSchema),
  })
  .superRefine((data, ctx) => {
    if (data.companions.length !== data.pax - 1) {
      ctx.addIssue({
        code: "custom",
        message: "Please fill details for every guest in your party",
        path: ["companions"],
      });
    }
  });

export type BookingInput = z.infer<typeof bookingSchema>;
export type GuestInput = z.infer<typeof guestSchema>;

export type FieldErrors = Record<string, string>;

type DraftGuest = {
  fullName: string;
  phone: string;
  email: string;
  designation: string;
  dietaryNote: string;
};

export type BookingDraft = {
  date: string;
  slotKey: string;
  pax: number;
  lead: DraftGuest;
  companions: DraftGuest[];
};

function flattenIssues(issues: z.ZodIssue[]): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of issues) {
    const key = issue.path.length ? issue.path.join(".") : "_form";
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

/** Client-side draft validation — errors persist until each field is valid. */
export function validateBookingDraft(draft: BookingDraft): FieldErrors {
  const errors: FieldErrors = {};

  if (!draft.date.trim()) {
    errors.date = "Please choose a date";
  }

  if (!draft.slotKey.trim()) {
    errors.slotKey = "Please choose a sitting";
  }

  const leadResult = guestSchema.safeParse({
    ...draft.lead,
    dietaryNote: draft.lead.dietaryNote || undefined,
  });
  if (!leadResult.success) {
    for (const issue of leadResult.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !errors[`lead.${field}`]) {
        errors[`lead.${field}`] = issue.message;
      }
    }
  }

  draft.companions.forEach((guest, idx) => {
    const result = guestSchema.safeParse({
      ...guest,
      dietaryNote: guest.dietaryNote || undefined,
    });
    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string") {
          const key = `companions.${idx}.${field}`;
          if (!errors[key]) errors[key] = issue.message;
        }
      }
    }
  });

  if (draft.companions.length !== Math.max(0, draft.pax - 1)) {
    errors.companions = "Please fill details for every guest in your party";
  }

  return errors;
}

export function validateBookingPayload(raw: unknown): FieldErrors {
  const parsed = bookingSchema.safeParse(raw);
  if (parsed.success) return {};
  return flattenIssues(parsed.error.issues);
}
