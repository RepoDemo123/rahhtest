async function handler() {
  await sql`TRUNCATE TABLE ingredients CASCADE`;

  return { success: true };
}
export async function POST(request) {
  return handler(await request.json());
}