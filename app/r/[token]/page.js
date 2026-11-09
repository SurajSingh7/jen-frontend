import SharedDocument from "@/components/patients/SharedDocument";

// Opened by patients from WhatsApp without a login; must stay out of search engines
export const metadata = { title: "Your Report", robots: { index: false, follow: false } };

export default async function SharedDocumentPage({ params }) {
  const { token } = await params;
  return <SharedDocument token={token} />;
}
