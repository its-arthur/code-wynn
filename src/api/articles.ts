/**
 * Wynncraft Publisher Articles API client.
 * GET /v3/publisher/articles/list/{articleType}
 * GET /v3/publisher/articles/fetch/article/{articleId}
 * Uses same-origin proxy in browser to avoid CORS.
 */

import type {
  ArticleType,
  ArticlesListResponse,
  ArticleItem,
  ArticleDetail,
} from "@/types/article";

const BASE =
  typeof window !== "undefined"
    ? "/api/wynn/publisher"
    : "https://api.wynncraft.com/v3/publisher";

export async function getArticlesList(
  articleType: ArticleType = "article",
  page?: number,
): Promise<ArticlesListResponse> {
  const path = `articles/list/${articleType}`;
  const url = page != null ? `${BASE}/${path}?page=${page}` : `${BASE}/${path}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Articles API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/** Flatten results object to array (keys "1", "2", ...), order preserved. */
export function articlesResultsToArray(
  results: Record<string, ArticleItem>
): ArticleItem[] {
  if (!results || typeof results !== "object") return [];
  return Object.keys(results)
    .sort((a, b) => Number(a) - Number(b))
    .map((k) => results[k]);
}

/**
 * Fetch a single article by ID.
 * GET /v3/publisher/articles/fetch/article/{articleId}
 */
export async function getArticle(articleId: number): Promise<ArticleDetail> {
  const path = `articles/fetch/article/${articleId}`;
  const url = `${BASE}/${path}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Article fetch error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}
