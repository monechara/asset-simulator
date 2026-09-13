import { Link } from "wouter";
import type { GuideArticle } from "@/content/guides";

type GuideCardProps = {
  article: GuideArticle;
  compact?: boolean;
};

export default function GuideCard({
  article,
  compact = false,
}: GuideCardProps) {
  return (
    <Link
      href={`/guide/${article.slug}`}
      className={`group block overflow-hidden rounded-2xl border border-[#d8ebe3] bg-white shadow-[0_6px_18px_rgba(31,97,80,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(31,97,80,0.1)] ${compact ? "flex sm:block" : "h-full"}`}
    >
      <div
        className={`relative overflow-hidden bg-[#eaf8f2] ${compact ? "h-28 w-28 shrink-0 sm:h-auto sm:w-auto sm:aspect-[16/8]" : "aspect-[16/9]"}`}
      >
        <img
          src={article.thumbnail}
          alt=""
          className={`h-full w-full transition duration-300 group-hover:scale-[1.03] ${compact ? "object-cover sm:object-contain sm:p-5" : "object-contain p-5"}`}
        />
        {article.isDraft && (
          <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[9px] font-black text-[#b36b2c] shadow-sm sm:left-3 sm:top-3 sm:text-[10px]">
            公開前確認用
          </span>
        )}
      </div>
      <div className={`${compact ? "min-w-0 p-3 sm:p-4" : "p-4"}`}>
        <div className="flex min-w-0 items-center gap-1.5 text-[10px] font-bold text-[#078c72] sm:gap-2 sm:text-[11px]">
          <span className="shrink-0 rounded-full bg-[#e5f6ee] px-2 py-1">
            {article.category}
          </span>
          <time
            className="truncate"
            dateTime={article.publishedAt.replaceAll(".", "-")}
          >
            {article.publishedAt}
          </time>
        </div>
        <h3 className="mt-1.5 line-clamp-2 text-sm font-black leading-5 text-[#10243a] sm:mt-2 sm:text-base sm:leading-6">
          {article.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[#61726c] sm:mt-2 sm:text-xs sm:leading-5">
          {article.summary}
        </p>
      </div>
    </Link>
  );
}
