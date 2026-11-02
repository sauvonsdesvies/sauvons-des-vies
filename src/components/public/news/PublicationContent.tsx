import { Fragment, type ReactNode } from "react";

// Render the limited markup produced by PublicationEditor as React elements.
// Raw HTML is always escaped; only <u> is interpreted, without attributes.
function inline(text: string, depth = 0): ReactNode {
  if (depth > 3) return text;
  const pattern = /\*\*[^*\n]+\*\*|__[^_\n]+__|<u>[\s\S]*?<\/u>|`[^`\n]+`|\*[^*\n]+\*|\[[^\]\n]+\]\([^\s)]+\)/g;
  const parts: ReactNode[] = [];
  let offset = 0;
  for (const match of text.matchAll(pattern)) {
    const token = match[0];
    const start = match.index!;
    parts.push(text.slice(offset, start));
    let node: ReactNode;
    if (token.startsWith("**") || token.startsWith("__")) node = <strong className="font-bold text-[#123B80]">{inline(token.slice(2, -2), depth + 1)}</strong>;
    else if (token.startsWith("<u>")) node = <u>{inline(token.slice(3, -4), depth + 1)}</u>;
    else if (token.startsWith("`")) node = <code className="rounded bg-slate-100 px-1 font-mono text-[0.9em] text-[#123B80]">{token.slice(1, -1)}</code>;
    else if (token.startsWith("*")) node = <em>{inline(token.slice(1, -1), depth + 1)}</em>;
    else {
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token)!;
      const safe = /^(https?:\/\/|mailto:)/i.test(link[2]) || (link[2].startsWith("/") && !link[2].startsWith("//"));
      node = safe ? <a href={link[2]} className="font-medium text-[#087CF3] underline underline-offset-2">{inline(link[1], depth + 1)}</a> : link[1];
    }
    parts.push(<Fragment key={start}>{node}</Fragment>);
    offset = start + token.length;
  }
  parts.push(text.slice(offset));
  return parts;
}

export default function PublicationContent({ content, mobile = false }: { content: string; mobile?: boolean }) {
  const blocks: ReactNode[] = [];
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  let paragraph: string[] = [];
  let list: string[] = [];
  let quote: string[] = [];
  const flushParagraph = () => { if (paragraph.length) { blocks.push(<p key={blocks.length} className="whitespace-pre-line">{inline(paragraph.join("\n"))}</p>); paragraph = []; } };
  const flushList = () => { if (list.length) { blocks.push(<ul key={blocks.length} className="list-disc space-y-1 pl-5">{list.map((item, index) => <li key={index}>{inline(item)}</li>)}</ul>); list = []; } };
  const flushQuote = () => { if (quote.length) { blocks.push(<blockquote key={blocks.length} className="rounded-lg border-l-4 border-[#70B8FF] bg-[#EDF9FF] px-4 py-3 italic text-[#143D92]">{inline(quote.join("\n"))}</blockquote>); quote = []; } };
  for (const original of lines) {
    // Excess toolbar markers are presentation debris, not publication content.
    const line = original.trim().replace(/^\*{3,}(?=\S)/, "").replace(/(\p{L})\*{2}(?=\p{L})/gu, "$1");
    if (!line) { flushParagraph(); flushList(); flushQuote(); continue; }
    if (/^[-*+]\s+/.test(line)) { flushParagraph(); flushQuote(); list.push(line.replace(/^[-*+]\s+/, "")); continue; }
    if (/^>\s?/.test(line)) { flushParagraph(); flushList(); quote.push(line.replace(/^>\s?/, "")); continue; }
    flushList(); flushQuote();
    const heading = /^#{1,6}\s+(.+)$/.exec(line);
    if (heading) { flushParagraph(); blocks.push(<h2 key={blocks.length} className="text-lg font-extrabold leading-snug text-[#092B83]">{inline(heading[1])}</h2>); }
    else paragraph.push(line);
  }
  flushParagraph(); flushList(); flushQuote();
  return <div className={`break-words text-[#4566A4] ${mobile ? "space-y-3 text-sm leading-[1.65] sm:text-sm" : "space-y-3 text-sm leading-[1.7] xl:text-base"}`}>{blocks}</div>;
}
