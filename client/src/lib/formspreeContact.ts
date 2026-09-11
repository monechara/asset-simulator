export const FORMSPREE_ENDPOINT = "https://formspree.io/f/xljezaln";

export type ContactPayload = {
  name: string;
  email: string;
  message: string;
  website?: string;
};

export async function submitContactToFormspree(
  payload: ContactPayload,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("email", payload.email);
  formData.append("message", payload.message);
  formData.append("_subject", "資産形成シミュレーターのお問い合わせ");

  if (payload.website) {
    formData.append("website", payload.website);
  }

  const response = await fetchImpl(FORMSPREE_ENDPOINT, {
    method: "POST",
    body: formData,
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    let detail = "";
    try {
      const body = (await response.json()) as { error?: string };
      detail = body.error ?? "";
    } catch {
      // Formspree may return a non-JSON error response.
    }
    throw new Error(detail || "Formspree request failed");
  }
}
