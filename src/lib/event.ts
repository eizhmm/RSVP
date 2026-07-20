export const VENUE = {
  name: "Garden Hall, The Green Room",
  address: "12 Jalan Damai, 50450 Kuala Lumpur",
} as const;

export const EVENT_NAME = "Kind Table";
export const EVENT_TAGLINE = "Charity Donation Dinner";

export type DinnerSession = {
  id: string;
  event_date: string;
  slot_key: string;
  slot_label: string;
  starts_at: string;
  capacity: number;
  seats_taken: number;
  seats_left: number;
};

export type GuestInput = {
  fullName: string;
  phone: string;
  email: string;
  designation: string;
  dietaryNote?: string;
};

export function formatSessionDate(dateStr: string) {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString("en-MY", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatClock(startsAt: string) {
  const [h, m] = startsAt.split(":");
  const hour = Number(h);
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = ((hour + 11) % 12) + 1;
  return `${display}:${m.slice(0, 2)} ${suffix}`;
}

export function formatTimeLabel(startsAt: string, slotLabel: string) {
  return `${formatClock(startsAt)} · ${slotLabel}`;
}
