import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/context/AuthContext";
import { SidebarProvider } from "@/context/SidebarContext";
import "./globals.css";

export const metadata = {
  title: "TuneIn - Cinematic Streaming",
  description: "Experience video streaming like never before.",
};

import Link from "next/link";
import ClientLayout from "@/components/ClientLayout";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <SidebarProvider>
            <Navbar />
            <ClientLayout>
              {children}
            </ClientLayout>
          </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
