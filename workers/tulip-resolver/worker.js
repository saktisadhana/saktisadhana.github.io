/**
 * tulip-pm registry resolver — Cloudflare Worker (intentionally vulnerable).
 *
 * This is the server-side half of the site's hidden CTF. It emulates a package
 * registry's "internal debug" resolver with a path-traversal bug: caller input
 * is joined onto a cache base and normalized with no traversal guard, so a
 * crafted `pkg` can climb out of artifacts/cache/ onto the off-limits build
 * secret and disclose it.
 *
 * The flag is NOT in this source — it's read from the FLAG secret you set in
 * Cloudflare (see README). Deploy is free and always-on (workers.dev).
 */

function normalize(path) {
  const stack = [];
  for (const part of String(path).split("/")) {
    if (part === "" || part === ".") continue;
    if (part === "..") stack.pop();
    else stack.push(part);
  }
  return stack.join("/");
}

const BASE = "artifacts/cache/";       // artifacts are supposed to stay under here
const SECRET_ARTIFACT = ".tulip/build.secret"; // ...but the build secret sits outside it

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const text = (body, status = 200) =>
      new Response(body, { status, headers: { "content-type": "text/plain; charset=utf-8" } });

    if (url.pathname === "/resolve") {
      // "internal debug interface" — must be explicitly enabled via header.
      if (request.headers.get("x-tulip-debug") !== "1") {
        return text("tulip-pm resolver: internal debug interface disabled (enable with X-Tulip-Debug: 1)\n", 403);
      }

      const pkg = url.searchParams.get("pkg") || "";
      const resolved = normalize(BASE + pkg);

      if (resolved === SECRET_ARTIFACT) {
        return text((env.FLAG || "flag not configured — set the FLAG secret") + "\n");
      }
      return text(`resolved: ${resolved}\nartifact not found\n`, 404);
    }

    return text(
      "tulip-pm registry v1.3.37\n" +
      "GET /resolve?pkg=<name>   (requires header  X-Tulip-Debug: 1)\n"
    );
  },
};
