/*!
 * tulip-pm v1.3.37 - tiny package/artifact resolver client
 * (c) saktisadhana - MIT
 * SECURITY: 1.3.37 ships an unpatched path-traversal in the registry resolver.
 *   advisory: /.well-known/ghsa-rcks-tul1-pm37/
 */
(function () {
  "use strict";

  // POSIX-ish path normalize (collapses "." and "..").
  function normalize(path) {
    var parts = String(path).split("/");
    var stack = [];
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (p === "" || p === ".") continue;
      if (p === "..") stack.pop();
      else stack.push(p);
    }
    return stack.join("/");
  }

  var TulipPM = {
    name: "tulip-pm",
    version: "1.3.37",
    advisory: "/.well-known/ghsa-rcks-tul1-pm37/",
    // Registry resolver API (the debug interface that discloses artifacts).
    // Set this to your deployed Cloudflare Worker base URL.
    registry: "https://tulip-pm-resolver.saktisadhana06.workers.dev",
    // Resolver base. Artifacts must stay under here; nothing above it is reachable.
    base: "artifacts/cache/",
    // VULNERABLE: trusts caller input, joins onto base, no traversal guard.
    resolve: function (pkg) {
      return normalize(this.base + pkg);
    }
  };

  window.TulipPM = TulipPM;

  // On the advisory page, preview how a payload normalizes (client-side only, no
  // flag here — the flag is disclosed by the registry's debug interface).
  document.addEventListener("DOMContentLoaded", function () {
    var out = document.getElementById("tulip-resolver");
    if (!out) return;

    var pkg = new URLSearchParams(window.location.search).get("pkg");
    if (!pkg) {
      out.textContent =
        "// local payload preview - append ?pkg=<path> to see how it resolves.\n" +
        "// the flag is served by the registry: " + TulipPM.registry + "/resolve";
      return;
    }

    var resolved = TulipPM.resolve(pkg);
    var onTarget = resolved === ".tulip/build.secret";
    out.textContent =
      "resolve(" + pkg + ")\n-> " + resolved + "\n\n" +
      (onTarget
        ? "// on target. now fetch it from the registry:\n" +
          "//   curl '" + TulipPM.registry + "/resolve?pkg=" + pkg + "' -H 'X-Tulip-Debug: 1'"
        : "// still inside artifacts/cache/ - keep climbing out.");
  });
})();
