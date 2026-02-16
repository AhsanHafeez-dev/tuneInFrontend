import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/context/AuthContext";
import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";
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
          <ThemeProvider>
            <SidebarProvider>
              <Navbar />
              <ClientLayout>
                {children}
              </ClientLayout>
            </SidebarProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
