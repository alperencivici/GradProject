import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CartProvider } from "@/context/CartContext";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Kırsof | Farm-to-Table Marketplace",
  description:
    "Connect directly with independent local farmers for premium, farm-fresh produce. No middlemen, fair prices, fresher food.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="antialiased bg-[#f4f3ec] text-stone-900 selection:bg-emerald-500 selection:text-white flex flex-col min-h-screen font-sans"
      >
        <CartProvider>
          <Toaster position="bottom-right" />
          <Navbar />
          <div className="pt-20 flex flex-col flex-1">{children}</div>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
