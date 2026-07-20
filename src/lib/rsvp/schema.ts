import { z } from "zod";

const guestSchema = z.object({
  fullName: z.string().trim().min(2, "Name is required"),
  phone: z.string().trim().min(8, "Phone is required"),
  email: z.string().trim().email("Valid email required"),
  designation: z.string().trim().min(2, "Designation is required"),
  dietaryNote: z.string().trim().optional(),
});

export const bookingSchema = z
  .object({
    slotKey: z.string().min(1),
    pax: z.number().int().min(1).max(5),
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
