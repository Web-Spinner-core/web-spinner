import "~/styles/globals.css"

export const metadata = {
  title: "Web Spinner",
  description: "A generative web application builder",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}