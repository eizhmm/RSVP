export type ExportGuest = {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  designation: string;
  dietary_note: string | null;
  party_code: string;
  registered_at: string;
};

export type ExportSession = {
  id: string;
  slot_key: string;
  event_date: string;
  starts_at: string;
  slot_label: string;
  capacity: number;
  seats_taken: number;
};

export type ExportSessionBlock = {
  session: ExportSession;
  guests: ExportGuest[];
  partyCount: number;
};
