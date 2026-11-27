import { dispatchArtwork } from "../../surface-dispatch/artwork";
import { getDispatchPosts } from "../../surface-dispatch/feed";

export async function GET() {
  const posts = (await getDispatchPosts()).map(({ id, title, category, summary, body, links, publish_at, pinned, pinScope, art, adminManaged, photo, photoAlt }) => ({
    id, title, summary, body, category, publish_at, pinned, pinScope, photo, photoAlt, adminManaged: adminManaged === true,
    artwork: dispatchArtwork({ id, category, art, photo, photoAlt }),
  }));
  const artworkByCategory = Object.fromEntries(["Release", "Maintenance", "Migration", "Field update"].map(category =>
    [category, dispatchArtwork({ category })]
  ));
  const photoLibrary = Array.from({ length: 9 }, (_, i) => dispatchArtwork({ category: "", art: i + 1 }));
  photoLibrary.unshift(dispatchArtwork({ id: "toastpunk-last-signal", category: "" }));
  return Response.json({ posts, artworkByCategory, photoLibrary }, {
    headers: { "Cache-Control": "no-store" },
  });
}
