/**
 * Wynncraft News API types (e.g. /v3/news/latest-news).
 */

export interface NewsItem {
  title: string;
  date: string;
  forumThread: string;
  author: string;
  content: string;
  comments: string;
}
