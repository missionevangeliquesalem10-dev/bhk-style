import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
// Si tu veux que le chat soit accessible partout, on peut imaginer un ContextProvider plus tard
// Mais pour l'instant, assurons-nous que le layout n'empêche pas l'affichage.

export const metadata = {
  title: 'Wotro - Louez en Liberté à Abidjan',
  description: 'La première plateforme de location de voitures de luxe et confort entre particuliers en Côte d\'Ivoire.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="bg-white text-slate-900 antialiased overflow-x-hidden flex flex-col min-h-screen">
        
        {/* EFFETS LUMINEUX (Z-INDEX 0) */}
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-50/50 rounded-full blur-[120px]" />
          <div className="absolute bottom-[5%] right-[-5%] w-[40%] h-[40%] bg-orange-50/40 rounded-full blur-[100px]" />
        </div>

        {/* BARRE DE NAVIGATION (Z-INDEX 50) */}
        <Navbar />
        
        {/* CONTENU PRINCIPAL (Z-INDEX 10) */}
        {/* On ajoute flex-1 pour pousser le footer en bas si la page est courte */}
        <main className="relative z-10 flex-1">
          {children}
        </main>

        {/* FOOTER (Z-INDEX 20) */}
        <Footer />

        {/* NOTE : La bulle de chat (ChatFloating) injectée dans VoitureDetail 
            doit avoir un z-index supérieur à 50 (ex: z-[100]) pour passer 
            DEVANT la Navbar et le Footer.
        */}
      </body>
    </html>
  )
}