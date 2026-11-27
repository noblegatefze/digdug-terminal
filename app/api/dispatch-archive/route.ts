import { dispatchArtwork } from "../../surface-dispatch/artwork";
import { getDispatchPosts } from "../../surface-dispatch/feed";

export async function GET() {
  const posts = (await getDispatchPosts()).map(({ id, title, category, publish_at, pinned, art, adminManaged }) => ({
    id, title, category, publish_at, pinned, adminManaged: adminManaged === true,
    artwork: dispatchArtwork({ id, category, art }),
  }));
  const artworkByCategory = Object.fromEntries(["Release", "Maintenance", "Migration", "Field update"].map(category =>
    [category, dispatchArtwork({ category })]
  ));
  return Response.json({ posts, artworkByCategory }, {
    headers: { "Cache-Control": "public, max-age=0, s-maxage=15" },
  });
}
