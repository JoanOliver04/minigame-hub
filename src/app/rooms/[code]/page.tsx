import { RoomClient } from "./RoomClient";

/**
 * Room codes are dynamic Firestore data, unknown at build time — unlike
 * /games/[gameId], this route is not statically generated. All the actual
 * lookup/subscription logic lives client-side in RoomClient (the app has
 * no server backend of its own).
 */
export default async function RoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <RoomClient code={code.toUpperCase()} />;
}
