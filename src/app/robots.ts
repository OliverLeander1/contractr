import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/opret", "/abforbruger", "/tilkoeb", "/pakke"],
        disallow: ["/projekt/", "/konto/", "/notifikationer/", "/hub/", "/haandvaerker/", "/raadgiver/"],
      },
    ],
    sitemap: "https://www.contractr.dk/sitemap.xml",
  };
}
