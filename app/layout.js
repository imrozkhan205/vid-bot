import "./globals.css";

export const metadata = {
  title: "Podcast Coach",
  description: "Ask questions answered from two podcast transcripts",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
