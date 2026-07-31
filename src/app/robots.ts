import type { MetadataRoute } from "next";

const BASE_URL = "https://www.bodyandsoul.hr";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/booking"],
        disallow: [
          "/api/",
          "/dashboard",
          "/admin",
          "/login",
          "/settings",
          "/employees",
          "/clients",
          "/reports",
          "/appointments",
          "/online-bookings",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
