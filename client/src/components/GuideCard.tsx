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
      className={`group block overflow-hidden rounded-2xl border border-[#d8ebe3] bg-white shadow-[0_6px_18px_rgba(31,97,80,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(31,97,80,0.1)] ${compact ? "" : "h-full"}`}
    >
      <div
        className={`relative overflow-hidden bg-[#eaf8f2] ${compact ? "aspect-[16/8]" : "aspect-[16/9]"}`}
      >
        <img
          src={article.thumbnail}
          alt=""
          className="h-full w-full object-contain p-5 transition duration-300 group-hover:scale-[1.03]"
        />
        {article.isDraft && (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2 py-1 text-[10px] font-black text-[#b36b2c] shadow-sm">
            公開前確認用
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 text-[11px] font-bold text-[#078c72]">
          <span className="rounded-full bg-[#e5f6ee] px-2 py-1">
            {article.category}
          </span>
          <time dateTime={article.publishedAt.replaceAll(".", "-")}>
            {article.publishedAt}
          </time>
        </div>
        <h3 className="mt-2 line-clamp-2 text-base font-black leading-6 text-[#10243a]">
          {article.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#61726c]">
          {article.summary}
        </p>
      </div>
    </Link>
  );
}
