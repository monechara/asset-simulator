import { Link } from "wouter";

export default function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-[#d8e8df] bg-[#fffdf7] px-5 py-7 text-center text-xs text-[#61726c] sm:px-8">
      <nav
        aria-label="サイト情報"
        className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
      >
        <Link
          href="/policy"
          className="transition-colors hover:text-[#087f6e] hover:underline"
        >
          運営・サイトポリシー
        </Link>
        <span aria-hidden="true" className="text-[#b8c9c2]">
          |
        </span>
        <Link
          href="/guide/"
          className="transition-colors hover:text-[#087f6e] hover:underline"
        >
          お金のガイド
        </Link>
        <span aria-hidden="true" className="text-[#b8c9c2]">
          |
        </span>
        <Link
          href="/contact"
          className="transition-colors hover:text-[#087f6e] hover:underline"
        >
          お問い合わせ
        </Link>
      </nav>
      <p className="mt-4">© 2026 資産形成シミュレーター</p>
    </footer>
  );
}
