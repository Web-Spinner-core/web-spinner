import "@ui/styles/globals.css";
import { Inter, JetBrains_Mono } from "next/font/google";
import { cn } from "@ui/lib/utils";

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata = {
  title: "Web Spinner",
  description: "A generative web application builder",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable,
          jetbrainsMono.variable
        )}
      >
        {children}
      </body>
    </html>
  );
}
