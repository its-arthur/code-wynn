"use client";

import { useEffect, useState } from "react";
import {
	getArticlesList,
	articlesResultsToArray,
	getArticle,
} from "@/api/articles";
import type {
	ArticleItem,
	ArticleController,
	ArticleDetail,
	ArticleType,
} from "@/types/article";
import { wynnNextgenPath } from "@/lib/wynn-cdn";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardAction,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ArticleDetailView } from "@/components/article-detail";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";

export function ArticlesSection() {
	const [articleType, setArticleType] = useState<ArticleType>("article");
	const [articlePage, setArticlePage] = useState(1);
	const [articles, setArticles] = useState<ArticleItem[]>([]);
	const [articleController, setArticleController] =
		useState<ArticleController | null>(null);
	const [articlesLoading, setArticlesLoading] = useState(true);
	const [articlesError, setArticlesError] = useState<string | null>(null);

	const [selectedArticle, setSelectedArticle] = useState<ArticleDetail | null>(
		null,
	);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [dialogLoading, setDialogLoading] = useState(false);

	function openArticle(pk: number) {
		setDialogOpen(true);
		setSelectedArticle(null);
		setDialogLoading(true);
		getArticle(pk)
			.then(setSelectedArticle)
			.finally(() => setDialogLoading(false));
	}

	useEffect(() => {
		setArticlesLoading(true);
		setArticlesError(null);
		getArticlesList(articleType, articlePage)
			.then((res) => {
				setArticles(articlesResultsToArray(res.results));
				setArticleController(res.controller);
			})
			.catch((e) =>
				setArticlesError(
					e instanceof Error ? e.message : "Failed to load articles",
				),
			)
			.finally(() => setArticlesLoading(false));
	}, [articleType, articlePage]);

	return (
		<section className="mt-16 w-full max-w-7xl">
			<h2 className="mb-6 text-center text-6xl lg:text-9xl font-pixel-circle">
				Articles
			</h2>

			<div className="mb-6 flex flex-wrap justify-center gap-2">
				{(["article", "blog", "giveaway", "event"] as ArticleType[]).map(
					(type) => (
						<button
							key={type}
							onClick={() => {
								setArticleType(type);
								setArticlePage(1);
							}}
							className={`hover:cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors border ${
								articleType === type
									? "bg-primary text-primary-foreground border-primary"
									: "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
							}`}
						>
							{type}
						</button>
					),
				)}
			</div>

			{articlesLoading && (
				<div className="grid gap-4 sm:grid-cols-2">
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="rounded-xl border overflow-hidden">
							<Skeleton className="aspect-video w-full rounded-none" />
							<div className="p-6 space-y-3">
								<Skeleton className="h-4 w-16" />
								<Skeleton className="h-5 w-3/4" />
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-1/3" />
							</div>
						</div>
					))}
				</div>
			)}
			{articlesError && (
				<p className="text-center text-sm text-destructive">{articlesError}</p>
			)}
			{!articlesLoading && !articlesError && articles.length === 0 && (
				<p className="text-center text-sm text-muted-foreground">
					No articles found.
				</p>
			)}
			{!articlesLoading && !articlesError && articles.length > 0 && (
				<>
					<div className="grid gap-4 sm:grid-cols-2">
						{articles.map((item) => (
							<Card
								key={item.pk}
								className="relative cursor-pointer overflow-hidden pt-0 transition-colors hover:bg-muted/50 hover:border-primary/40"
								onClick={() => openArticle(item.pk)}
							>
								{item.banner && (
									<>
										<img
											src={wynnNextgenPath(item.banner)}
											alt={item.title}
											className="relative z-20 aspect-video w-full object-cover"
										/>
									</>
								)}
								<CardHeader>
									<CardAction>
										<Badge
											variant="secondary"
											className="font-mono text-xs uppercase tracking-widest"
										>
											{item.type}
										</Badge>
									</CardAction>
									<CardTitle className="font-sans leading-tight">
										{item.title}
									</CardTitle>
									{item.recap && (
										<CardDescription className="font-sans line-clamp-3">
											{item.recap}
										</CardDescription>
									)}
									<p className="font-mono text-xs text-muted-foreground">
										{new Date(item.published_at).toLocaleDateString()}
									</p>
								</CardHeader>
							</Card>
						))}
					</div>

					{articleController && articleController.pages > 1 && (
						<Pagination className="mt-8">
							<PaginationContent>
								<PaginationItem>
									<PaginationPrevious
										onClick={() => setArticlePage((p) => p - 1)}
										aria-disabled={articleController.prev === null}
										className={
											articleController.prev === null
												? "pointer-events-none opacity-50"
												: "cursor-pointer"
										}
									/>
								</PaginationItem>
								{Array.from(
									{ length: articleController.pages },
									(_, i) => i + 1,
								).map((page) => (
									<PaginationItem key={page}>
										<PaginationLink
											isActive={page === articleController.current}
											onClick={() => setArticlePage(page)}
											className="cursor-pointer"
										>
											{page}
										</PaginationLink>
									</PaginationItem>
								))}
								<PaginationItem>
									<PaginationNext
										onClick={() => setArticlePage((p) => p + 1)}
										aria-disabled={articleController.next === null}
										className={
											articleController.next === null
												? "pointer-events-none opacity-50"
												: "cursor-pointer"
										}
									/>
								</PaginationItem>
							</PaginationContent>
						</Pagination>
					)}
				</>
			)}
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className="max-h-[90vh] w-full sm:max-w-7xl overflow-hidden p-0 gap-0">
					<DialogTitle className="sr-only">Article</DialogTitle>
					<div className="overflow-y-auto max-h-[90vh] p-6 pt-10">
						{dialogLoading && (
							<div className="w-full max-w-2xl mx-auto space-y-4">
								<Skeleton className="aspect-video w-full rounded-lg" />
								<Skeleton className="h-5 w-24" />
								<Skeleton className="h-8 w-3/4" />
								<Skeleton className="h-5 w-full" />
								<Skeleton className="h-5 w-2/3" />
								<Skeleton className="h-px w-full my-6" />
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-5/6" />
							</div>
						)}
						{!dialogLoading && selectedArticle && (
							<ArticleDetailView article={selectedArticle} />
						)}
					</div>
				</DialogContent>
			</Dialog>
		</section>
	);
}
