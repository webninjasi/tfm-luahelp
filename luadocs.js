// Extracts the Lua manual entries linked from the lua tree into parsed/luadocs.json
const fs = require("fs");
const https = require("https");

const manualUrl = "https://www.lua.org/manual/5.2/manual.html";
const outputFile = "parsed/luadocs.json";
const allowedTags = new Set(["p", "code", "em", "b", "i", "ul", "ol", "li", "pre", "sup", "sub", "br"]);

const download = url => new Promise((resolve, reject) => {
  https.get(url, res => {
    if (res.statusCode != 200) {
      res.resume();
      reject(new Error(`Manual request failed: ${res.statusCode}`));
      return;
    }

    const chunks = [];
    res.on("data", chunk => chunks.push(chunk));
    res.on("end", () => resolve(Buffer.concat(chunks).toString("latin1")));
  }).on("error", reject);
});

const collapseSpaces = html => html.split(/(<pre>[\s\S]*?<\/pre>)/i).map(
  (part, idx) => idx % 2 ? part : part.replace(/\s+/g, " ")
).join("");

const resolveLink = (href, treeNames) => {
  const internal = href.match(/^#pdf-(.+)$/)?.[1];

  if (internal && treeNames.has(internal)) {
    return `href="#${internal}"`;
  }

  return `href="${href.startsWith("#") ? manualUrl + href : href}" target="_blank" rel="noopener"`;
};

const sanitize = (html, treeNames) => collapseSpaces(
  html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (_, attrs, inner) => {
      const href = attrs.match(/href="([^"]+)"/i)?.[1];
      return href ? `\0a ${resolveLink(href, treeNames)}\0${inner}\0/a\0` : inner;
    })
    .replace(/<(\/?)([a-z0-9]+)[^>]*>/gi, (_, close, tag) => (
      allowedTags.has(tag.toLowerCase()) ? `<${close}${tag.toLowerCase()}>` : ""
    ))
    .replace(/\0(\/?a[^\0]*)\0/g, "<$1>")
).replace(/(<p>\s*)+/g, "<p>").replace(/^\s*<p>\s*/, "").replace(/\s*<p>\s*$/, "").trim();

const stripTags = html => html
  .replace(/<\/?(p|ul|ol|li|pre|br)>/gi, " ")
  .replace(/<[^>]+>/g, "")
  .replace(/\s+/g, " ")
  .trim();

const getParams = signature => {
  const inner = signature.match(/\((.*)\)/)?.[1] || "";
  return inner.replace(/&[a-z]+;/gi, " ").match(/[a-z_]\w*/gi) || [];
};

const createEntry = (signature, html) => {
  const text = stripTags(html);

  return {
    ...(signature ? { signature, params: getParams(signature) } : {}),
    text,
    html,
  };
};

const parseEntry = (manual, name, treeNames) => {
  const anchor = `<a name="pdf-${name}">`;
  const start = manual.indexOf(anchor);

  if (start == -1) {
    return null;
  }

  const heading = manual.slice(Math.max(0, start - 4), start) == "<h3>";

  if (heading) {
    const headEnd = manual.indexOf("</h3>", start);
    const signature = stripTags(manual.slice(start, headEnd));
    const bodyStart = headEnd + 5;
    const bodyEnd = manual.slice(bodyStart).search(/<hr>|<h[12]>/i);
    return createEntry(signature, sanitize(manual.slice(bodyStart, bodyStart + bodyEnd), treeNames));
  }

  // Library tables are introduced inside a paragraph
  const paragraphStart = manual.lastIndexOf("<p>", start);
  const paragraphEnd = manual.indexOf("<p>", start);
  return createEntry(null, sanitize(manual.slice(paragraphStart, paragraphEnd), treeNames));
};

const main = async () => {
  const tree = JSON.parse(fs.readFileSync("parsed/latest", "utf8")).tree;
  const treeNames = new Set(tree.map(x => x.href?.split("#pdf-")[1]).filter(Boolean));
  const manual = await download(manualUrl);
  const entries = {};
  const missing = [];

  treeNames.forEach(name => {
    const entry = parseEntry(manual, name, treeNames);

    if (entry) {
      entries[name] = entry;
    } else {
      missing.push(name);
    }
  });

  fs.writeFileSync(outputFile, JSON.stringify({
    source: manualUrl,
    license: "Copyright 2011-2013 Lua.org, PUC-Rio. Freely available under the terms of the Lua license.",
    entries,
  }));
  console.log(`Saved ${Object.keys(entries).length} entries to ${outputFile}`);

  if (missing.length) {
    console.warn("Not found in manual:", missing.join(", "));
  }
};

main().catch(err => {
  console.error(err);
  process.exit(1);
});
