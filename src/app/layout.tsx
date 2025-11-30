import type { Metadata } from "next";
import "./globals.css";
import Header from "@/shared/widgets/header";
import { Poppins, Roboto } from "next/font/google";
import Providers from "./providers";
export const metadata: Metadata = {
  title: "E-commerce Multi Vendor",
  description:
    "E-commerce Multi Vendor app built with express.js and microservice",
};

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
  variable: "--font-roboto",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${roboto.variable} ${poppins.variable}`}>
        <Providers>

        <Header />
        {children}F
        </Providers>
      </body>
    </html>
  );
}
