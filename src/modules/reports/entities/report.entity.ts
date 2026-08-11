export const REPORT_KINDS = ['person', 'pet'] as const;
export const REPORT_STATUSES = ['missing', 'found'] as const;

export type ReportKind = (typeof REPORT_KINDS)[number];
export type ReportStatus = (typeof REPORT_STATUSES)[number];

/** Fila tal como vive en PostgreSQL (snake_case). */
export interface ReportRow {
  id: string;
  kind: ReportKind;
  status: ReportStatus;
  name: string | null;
  description: string | null;
  photo_url: string | null;
  photo_public_id: string | null;
  city: string;
  neighborhood: string | null;
  location_detail: string | null;
  event_at: Date | null;
  approx_age: number | null;
  clothing: string | null;
  health_status: string | null;
  species: string | null;
  color: string | null;
  contact_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  user_id: string | null;
  resolved_at: Date | null;
  is_hidden: boolean;
  created_at: Date;
  updated_at: Date;
}

/** Reporte expuesto por la API (camelCase). */
export interface Report {
  id: string;
  kind: ReportKind;
  status: ReportStatus;
  name: string | null;
  description: string | null;
  photoUrl: string | null;
  city: string;
  neighborhood: string | null;
  locationDetail: string | null;
  eventAt: string | null;
  approxAge: number | null;
  clothing: string | null;
  healthStatus: string | null;
  species: string | null;
  color: string | null;
  contactName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  isMine: boolean;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toReport(row: ReportRow, currentUserId?: string): Report {
  return {
    id: row.id,
    kind: row.kind,
    status: row.status,
    name: row.name,
    description: row.description,
    photoUrl: row.photo_url,
    city: row.city,
    neighborhood: row.neighborhood,
    locationDetail: row.location_detail,
    eventAt: row.event_at?.toISOString() ?? null,
    approxAge: row.approx_age,
    clothing: row.clothing,
    healthStatus: row.health_status,
    species: row.species,
    color: row.color,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    isMine: Boolean(currentUserId && row.user_id === currentUserId),
    resolvedAt: row.resolved_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}
