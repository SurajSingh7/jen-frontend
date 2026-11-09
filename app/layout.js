import { Inter } from "next/font/google";
import PwaClient from "@/components/PwaClient";
import AppToaster from "@/components/AppToaster";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: { default: "Jen Pathology", template: "%s · Jen Pathology" },
  description: "Jen Pathology lab management",
  applicationName: "Jen Pathology",
  appleWebApp: { capable: true, title: "Jen Pathology", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  robots: { index: false, follow: false },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1f2937",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.className} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <PwaClient />
        <AppToaster />
        {children}
      </body>
    </html>
  );
}
