/** One participant per known email and campaign; anonymous records use their ID. */
export function countParticipants(donations: ReadonlyArray<{ id?: string; donorEmail?: string | null; campaignId?: string }>): number {
  return new Set(donations.map((donation, index) => `${donation.campaignId ?? ""}:${donation.donorEmail?.trim().toLowerCase() || donation.id || index}`)).size;
}
