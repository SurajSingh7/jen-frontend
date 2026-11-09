// Web app manifest: makes Jen Pathology installable (home screen / desktop app window)
export default function manifest() {
  return {
    name: "Jen Pathology",
    short_name: "Jen Pathology",
    description: "Jen Pathology lab management",
    id: "/",
    start_url: "/patients",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#f8fafc",
    theme_color: "#1f2937",
    categories: ["medical"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
