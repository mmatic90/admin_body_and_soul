export default function PublicFooter() {
  return (
    <footer className="border-t border-[#eadbd2] bg-[#f8f3ef] px-6 py-8 text-center text-sm text-[#6f5a50]">
      <p>© {new Date().getFullYear()} Body &amp; Soul. Sva prava pridržana.</p>

      <p className="mt-2">
        Web stranica i booking sustav izradio{" "}
        <a
          href="https://mit-informatika.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-[#2f2723] underline-offset-4 hover:underline"
        >
          M.i.T. informatika
        </a>
        .
      </p>
    </footer>
  );
}
