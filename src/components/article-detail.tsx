import type { ArticleDetail, ArticleContentBlock } from "@/types/article";
import { wynnNextgenPath } from "@/lib/wynn-cdn";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Pin } from "lucide-react";

// ---------------------------------------------------------------------------
// Inline markdown renderer for Discord-flavoured text blocks
// Handles: # h1, ## h2, ### h3, -# small, [text](url), **bold**, *italic*
// ---------------------------------------------------------------------------

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\[(?:[^\]]+)\]\((?:[^)]+)\)|\*\*(?:[^*]+)\*\*|\*(?:[^*]+)\*)/g);
  const nodes: React.ReactNode[] = [];
  let i = 0;
  while (i < parts.length) {
    const part = parts[i];
    if (!part) { i++; continue; }
    if (part.startsWith("[") && part.includes("](")) {
      const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (m) {
        nodes.push(
          <a key={i} href={m[2]} target="_blank" rel="noopener noreferrer"
            className="font-medium text-primary underline underline-offset-4 hover:opacity-75 transition-opacity">
            {m[1]}
          </a>
        );
        i++; continue;
      }
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      nodes.push(<strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>);
      i++; continue;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      nodes.push(<em key={i}>{part.slice(1, -1)}</em>);
      i++; continue;
    }
    nodes.push(part);
    i++;
  }
  return nodes;
}

function renderTextBlock(raw: string) {
  const lines = raw.split("\n");
  const elements: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    const trimmed = line.trimStart();

    if (trimmed.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="font-sans mt-6 text-base font-semibold tracking-tight">
          {renderInline(trimmed.slice(4))}
        </h3>
      );
    } else if (trimmed.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="font-sans mt-8 text-lg font-bold tracking-tight">
          {renderInline(trimmed.slice(3))}
        </h2>
      );
    } else if (trimmed.startsWith("# ")) {
      elements.push(
        <h1 key={i} className="font-sans mt-8 text-xl font-bold tracking-tight">
          {renderInline(trimmed.slice(2))}
        </h1>
      );
    } else if (trimmed.startsWith("-# ")) {
      elements.push(
        <p key={i} className="font-mono mt-2 text-xs text-muted-foreground/70">
          {renderInline(trimmed.slice(3))}
        </p>
      );
    } else if (trimmed === "") {
      elements.push(<div key={i} className="mt-3" />);
    } else {
      elements.push(
        <p key={i} className="font-sans mt-3 text-sm leading-7 text-foreground/90">
          {renderInline(trimmed)}
        </p>
      );
    }
  });

  return elements;
}

// ---------------------------------------------------------------------------
// Content block renderers
// ---------------------------------------------------------------------------

function TextBlock({ block }: { block: ArticleContentBlock }) {
  if (typeof block.content !== "string") return null;
  return <div>{renderTextBlock(block.content)}</div>;
}

function ImageBlock({ block }: { block: ArticleContentBlock }) {
  if (!Array.isArray(block.content) || block.content.length === 0) return null;
  const images = block.content as string[];
  return (
    <div className="mt-5 flex flex-col items-center gap-4">
      {images.map((src, i) => (
        <div key={i} className="w-full overflow-hidden rounded-lg bg-transparent">
          <img
            src={wynnNextgenPath(src)}
            alt=""
            className="w-full object-contain transition-transform duration-300 hover:scale-105"
          />
        </div>
      ))}
    </div>
  );
}

function ContentBlock({ block }: { block: ArticleContentBlock }) {
  if (!block.website) return null;
  if (block.type === "text") return <TextBlock block={block} />;
  if (block.type === "image") return <ImageBlock block={block} />;
  return null;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ArticleDetailView({ article }: { article: ArticleDetail }) {
  return (
    <article className="w-full max-w-2xl mx-auto">
      {/* Banner */}
      {article.banner && (
        <div className="overflow-hidden rounded-lg">
          <img
            src={wynnNextgenPath(article.banner)}
            alt={article.title}
            className={`w-full object-cover ${article.banner_zoom ? "aspect-21/9 scale-105" : "aspect-video"}`}
          />
        </div>
      )}

      {/* Header */}
      <div className="mt-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="font-mono capitalize text-xs">
            {article.destination}
          </Badge>
          {article.pinned && (
            <Badge variant="outline" className="font-mono text-xs gap-1">
              <Pin className="size-3" />
              Pinned
            </Badge>
          )}
        </div>

        <h1 className="font-sans text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
          {article.title}
        </h1>

        {article.recap && (
          <p className="font-sans mt-2 text-base text-muted-foreground leading-relaxed">
            {article.recap}
          </p>
        )}

        <div className="font-mono mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/80">{article.created_by}</span>
          <span>·</span>
          <span>
            {new Date(article.published_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          {article.likes > 0 && (
            <>
              <span>·</span>
              <span>{article.likes} likes</span>
            </>
          )}
        </div>
      </div>

      <Separator className="my-6" />

      {/* Content */}
      <div className="space-y-1">
        {article.content.map((block) => (
          <ContentBlock key={block.id} block={block} />
        ))}
      </div>
    </article>
  );
}
