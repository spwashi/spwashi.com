/**
 * Machine readings: an Atom feed, a sitemap, and now.json. A feed is how a
 * periodical is followed without anyone keeping a list.
 */
import { DEPARTMENTS, HOUSE_STYLE, OPEN_QUESTIONS, SERIES, USES } from "./room.js";
import { numbered, printed } from "./catalog.js";
import { NAME, ORIGIN, VERSION, escapeHtml } from "./layout.js";

const newest = () => printed.map((i) => i.date).filter(Boolean).sort().pop() || "2026-09-24";

export function atom() {
  const entries = [...printed]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)) || b.index - a.index)
    .map((i) => {
      const url = `${ORIGIN}/${i.slug}/`;
      const content = i.body.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
      return `  <entry>
    <title>${escapeHtml(`${SERIES[i.series].label} ${i.no} — ${i.title}`)}</title>
    <link href="${url}"/>
    <id>${url}</id>
    <updated>${i.date}T00:00:00Z</updated>
    <summary>${escapeHtml(i.dek)}</summary>
    <content type="html">${escapeHtml(content)}</content>
  </entry>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${NAME}</title>
  <subtitle>A periodical of wonder about π and pie, with a supplement on e.</subtitle>
  <link href="${ORIGIN}/feed.xml" rel="self"/>
  <link href="${ORIGIN}/"/>
  <id>${ORIGIN}/</id>
  <updated>${newest()}T00:00:00Z</updated>
  <author><name>${NAME}</name></author>
${entries}
</feed>
`;
}

export function sitemap() {
  const paths = ["/", "/contents/", "/colophon/", "/corrections/", ...printed.map((i) => `/${i.slug}/`)];
  return `<?xml version="1.0" encoding="utf-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `  <url><loc>${ORIGIN}${p}</loc></url>`).join("\n")}
</urlset>
`;
}

export function nowJson() {
  return {
    version: VERSION,
    name: NAME,
    numbering: "Issue n of a series is its constant to n decimal places.",
    series: Object.fromEntries(Object.entries(SERIES).map(([key, s]) => [key, { name: s.name, label: s.label, about: s.about }])),
    departments: Object.fromEntries(Object.entries(DEPARTMENTS).map(([key, d]) => [key, d.name])),
    issues: printed.map(({ series, no, slug, title, dek, status, department, date, clip, uses, figure }) => ({
      series, no, slug, title, dek, status, department, date,
      clip: clip || null, uses: uses || null, figure: figure?.kind || null, url: `${ORIGIN}/${slug}/`,
    })),
    forthcoming: numbered.filter((i) => i.status === "open").map(({ series, no, slug, title, question }) => ({ series, no, slug, title, question })),
    room: { houseStyle: HOUSE_STYLE, openQuestions: OPEN_QUESTIONS, uses: Object.fromEntries(USES) },
  };
}
