import { store } from "@/lib/store";

/** Serves a game's banner image. URLs carry ?v=<upload time>, so they can be cached forever. */
export async function GET(_req: Request, ctx: RouteContext<"/banners/[id]">) {
  const { id } = await ctx.params;
  const banner = await store.get("banners", id).catch(() => null);
  const match = banner?.image.match(/^data:(image\/[a-z]+);base64,(.+)$/);
  if (!match) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(match[2], "base64"), {
    headers: {
      "Content-Type": match[1],
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
