import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_DOMAIN = "www.bodyandsoul.hr";
const APEX_DOMAIN = "bodyandsoul.hr";
const ADMIN_DOMAIN = "admin.bodyandsoul.hr";

function getHostname(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host") ?? "";

  return host.split(":")[0].toLowerCase();
}

function isPublicPage(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/booking" ||
    pathname.startsWith("/booking/") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  );
}

function isPublicApi(pathname: string) {
  return pathname.startsWith("/api/public/");
}

function isAdminPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname.startsWith("/auth/")
  );
}

export async function middleware(request: NextRequest) {
  const hostname = getHostname(request);
  const pathname = request.nextUrl.pathname;

  const isProductionPublicDomain =
    hostname === PUBLIC_DOMAIN || hostname === APEX_DOMAIN;

  const isProductionAdminDomain = hostname === ADMIN_DOMAIN;

  /*
   * 1. bodyandsoul.hr preusmjeri na www.bodyandsoul.hr
   */
  if (hostname === APEX_DOMAIN) {
    const url = request.nextUrl.clone();

    url.protocol = "https:";
    url.host = PUBLIC_DOMAIN;

    return NextResponse.redirect(url, 308);
  }

  /*
   * 2. Na javnoj domeni admin stranice prebaci na admin domenu.
   *
   * Primjer:
   * www.bodyandsoul.hr/dashboard
   * → admin.bodyandsoul.hr/dashboard
   */
  if (isProductionPublicDomain && isAdminPath(pathname)) {
    const url = request.nextUrl.clone();

    url.protocol = "https:";
    url.host = ADMIN_DOMAIN;

    return NextResponse.redirect(url);
  }

  /*
   * 3. Na admin domeni javne stranice prebaci na www domenu.
   *
   * Iznimka je "/", koja vodi na dashboard.
   */
  if (isProductionAdminDomain && pathname === "/") {
    const url = request.nextUrl.clone();

    url.pathname = "/dashboard";

    return NextResponse.redirect(url);
  }

  if (
    isProductionAdminDomain &&
    (pathname === "/booking" || pathname.startsWith("/booking/"))
  ) {
    const url = request.nextUrl.clone();

    url.protocol = "https:";
    url.host = PUBLIC_DOMAIN;

    return NextResponse.redirect(url);
  }

  /*
   * 4. Na javnoj domeni ne dopuštaj druge aplikacijske stranice.
   *
   * Ako se naknadno dodaju nove javne stranice, potrebno ih je dodati
   * u funkciju isPublicPage().
   */
  if (
    isProductionPublicDomain &&
    !isPublicPage(pathname) &&
    !isPublicApi(pathname)
  ) {
    const url = request.nextUrl.clone();

    url.pathname = "/";
    url.search = "";

    return NextResponse.redirect(url);
  }

  /*
   * 5. Supabase session middleware.
   *
   * Ovaj dio je zadržan iz postojećeg middlewarea.
   */
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2)$).*)",
  ],
};
