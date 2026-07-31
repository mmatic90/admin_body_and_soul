import type { MetadataRoute } from "next";

const BASE_URL = "https://www.bodyandsoul.hr";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: BASE_URL,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/booking`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];
}
