import { MessageCircle } from "lucide-react";

type Props = {
  lang?: "hr" | "en";
};

export default function FloatingWhatsAppButton({ lang = "hr" }: Props) {
  const label =
    lang === "en" ? "Contact us on WhatsApp" : "Kontaktiraj nas na WhatsApp";

  return (
    <a
      href="https://wa.me/385993284199"
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="fixed bottom-5 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full border border-[#eadbd2] bg-[#2f2723] text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-[#4a3932]"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
