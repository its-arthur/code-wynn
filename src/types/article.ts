/**
 * Wynncraft Publisher Articles API types.
 * GET /v3/publisher/articles/list/{articleType}
 */

export type ArticleType = "article" | "blog" | "giveaway" | "event";

export interface ArticleController {
  count: number;
  current_count: number;
  pages: number;
  prev: number | null;
  current: number;
  next: number | null;
}

export interface ArticleItem {
  pk: number;
  title: string;
  type: string;
  banner: string;
  banner_zoom: boolean;
  recap: string;
  visible: boolean;
  start_date: string | null;
  end_date: string | null;
  pinned: boolean;
  has_content: boolean;
  published_at: string;
}

export interface ArticlesListResponse {
  controller: ArticleController;
  results: Record<string, ArticleItem>;
}

/**
 * Single article fetch: GET /v3/publisher/articles/fetch/article/{articleId}
 */
export interface ArticleContentBlock {
  id: string;
  type: string;
  focus: boolean;
  content: string | string[];
  discord: boolean;
  website: boolean;
}

export interface ArticleDetail {
  id: number;
  created_by: string;
  discord_messages: Record<string, string>;
  discord_recap: boolean;
  allow_discord: boolean;
  destination: string;
  published: boolean;
  pinned: boolean;
  visible: boolean;
  content: ArticleContentBlock[];
  start_date: string | null;
  end_date: string | null;
  recap: string;
  title: string;
  banner: string;
  banner_zoom: boolean;
  likes: number;
  published_at: string;
}
