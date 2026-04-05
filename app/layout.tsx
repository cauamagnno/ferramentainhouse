import type React from "react"
import type { Metadata } from "next"
import { Geist } from "next/font/google"
import { Manrope } from "next/font/google"
import "./globals.css"

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
})

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
})

export const metadata: Metadata = {
  title: "Calculadora InHouse Market - Simulador de Franquia",
  description: "Ferramenta profissional para calcular investimento, DRE e viabilidade de franquias InHouse Market",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${geist.variable} ${manrope.variable} antialiased dark`}>
      <body className="font-sans bg-[#0a0a0a] text-white">{children}</body>
    </html>
  )
}
