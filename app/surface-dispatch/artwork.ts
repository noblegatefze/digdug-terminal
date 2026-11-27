const sceneDescriptions = [
  "An overturned chair and headset inside the abandoned relay station",
  "An old Terminal lights up inside a polar cave",
  "Three mining camps along the Ice Wall",
  "Three prison doors below the ice",
  "Explorers gather at the Ice Wall at dawn",
  "An explorer carries glowing cargo into an extraction bay",
  "Maintenance tools beside an idle relay",
  "The old Terminal beside a new Explorer station",
  "An Observatory telescope overlooks the mining camps",
];

const categoryScene: Record<string, number> = {
  Releases: 6, Maintenance: 7, Migration: 8, "Field update": 9,
};

export function dispatchArtwork(post: { id?: string; category: string; art?: number; photo?: string | null; photoAlt?: string | null }) {
  if (post.photo?.startsWith("https://")) {
    return { path: post.photo, position: "center", size: "cover", alt: post.photoAlt || "Dispatch photo", key: post.photo };
  }
  const capture = post.photo ? post.photo === "toastpunk" : post.id === "toastpunk-last-signal";
  const scene = post.photo?.startsWith("scene-") ? Number(post.photo.slice(6)) - 1 : (post.art ?? categoryScene[post.category === "Release" ? "Releases" : post.category] ?? 9) - 1;
  const position = [1, 50, 99];
  return capture ? {
    key: "toastpunk", path: "/toastpunk-terminal-prison.png",
    position: "center",
    size: "cover",
    alt: "ToastPunk is pulled through the Terminal screen toward the barred prison inside the Ice Wall",
  } : {
    key: "scene-" + (scene + 1), path: "/surface-dispatch-illustrations.png",
    position: `${position[scene % 3]}% ${position[Math.floor(scene / 3)]}%`,
    size: "318% 318%",
    alt: sceneDescriptions[scene],
  };
}
