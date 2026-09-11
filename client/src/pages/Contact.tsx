import { FormEvent, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import SiteFooter from "@/components/SiteFooter";
import { submitContactToFormspree } from "@/lib/formspreeContact";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setSubmitted(false);
    setSubmitError(false);
    setIsSubmitting(true);

    try {
      await submitContactToFormspree({ name, email, message, website });
      setSubmitted(true);
      setName("");
      setEmail("");
      setMessage("");
      setWebsite("");
      toast.success("お問い合わせを送信しました。", { duration: 5000 });
    } catch {
      setSubmitError(true);
      toast.error("送信に失敗しました。時間をおいて再度お試しください。", {
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffdf7] text-[#183b35]">
      <header className="border-b border-[#d8e8df] bg-white/90 px-5 py-4 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link
            href="/"
            className="text-sm font-extrabold tracking-wide text-[#087f6e]"
          >
            資産形成シミュレーター
          </Link>
          <Link
            href="/"
            className="text-xs font-bold text-[#61726c] hover:text-[#087f6e]"
          >
            シミュレーターへ戻る
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-8">
          <p className="text-xs font-bold tracking-[0.16em] text-[#e69b22]">
            CONTACT
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-[#183b35] sm:text-3xl">
            お問い合わせ
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#61726c]">
            サービスに関するご質問、ご意見、不具合のご連絡はこちらからお送りください。
          </p>
        </div>

        {submitted ? (
          <section className="rounded-2xl border border-[#b9e0d1] bg-[#f0fbf5] px-5 py-7 text-center sm:px-8">
            <h2 className="text-lg font-black text-[#087f6e]">
              お問い合わせを受け付けました
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#425d55]">
              ご連絡ありがとうございます。内容を確認のうえ、必要に応じてご返信します。
            </p>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="mt-5 rounded-full border border-[#b9e0d1] bg-white px-5 py-2.5 text-sm font-bold text-[#087f6e] hover:bg-[#f8fffb]"
            >
              続けて送信する
            </button>
          </section>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-[#d8e8df] bg-white p-5 shadow-[0_8px_24px_rgba(25,78,64,0.05)] sm:p-8"
          >
            <div className="space-y-5">
              <label className="block">
                <span className="text-sm font-bold text-[#183b35]">
                  お名前{" "}
                  <span className="font-normal text-[#8a9b95]">（任意）</span>
                </span>
                <input
                  value={name}
                  onChange={event => setName(event.target.value)}
                  maxLength={120}
                  autoComplete="name"
                  className="mt-2 w-full rounded-xl border border-[#cfe1d9] bg-[#fffefa] px-4 py-3 text-sm outline-none transition focus:border-[#087f6e] focus:ring-2 focus:ring-[#087f6e]/15"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-[#183b35]">
                  メールアドレス <span className="text-[#d6695f]">*</span>
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  maxLength={320}
                  autoComplete="email"
                  className="mt-2 w-full rounded-xl border border-[#cfe1d9] bg-[#fffefa] px-4 py-3 text-sm outline-none transition focus:border-[#087f6e] focus:ring-2 focus:ring-[#087f6e]/15"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-[#183b35]">
                  お問い合わせ内容 <span className="text-[#d6695f]">*</span>
                </span>
                <textarea
                  required
                  minLength={10}
                  maxLength={5000}
                  value={message}
                  onChange={event => setMessage(event.target.value)}
                  rows={7}
                  className="mt-2 w-full resize-y rounded-xl border border-[#cfe1d9] bg-[#fffefa] px-4 py-3 text-sm leading-7 outline-none transition focus:border-[#087f6e] focus:ring-2 focus:ring-[#087f6e]/15"
                />
                <span className="mt-1 block text-right text-xs text-[#8a9b95]">
                  10文字以上・5,000文字以内
                </span>
              </label>

              <label
                aria-hidden="true"
                className="absolute -left-[9999px] h-px w-px overflow-hidden"
              >
                <span>Website</span>
                <input
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={event => setWebsite(event.target.value)}
                />
              </label>
            </div>

            <p className="mt-6 text-xs leading-6 text-[#71847c]">
              送信された情報は、お問い合わせへの対応に必要な範囲で利用します。詳しくは
              <Link href="/policy" className="mx-1 text-[#087f6e] underline">
                運営・サイトポリシー
              </Link>
              をご確認ください。
            </p>
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 w-full rounded-xl bg-[#087f6e] px-5 py-3.5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(8,127,110,0.18)] transition hover:bg-[#066b5d] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "送信中…" : "お問い合わせを送信"}
            </button>
            {submitError && (
              <p
                role="alert"
                className="mt-4 text-center text-sm font-bold text-[#c55d56]"
              >
                送信に失敗しました。入力内容をご確認のうえ、時間をおいて再度お試しください。
              </p>
            )}
          </form>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
