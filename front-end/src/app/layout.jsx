import './globals.css'
import dynamic from 'next/dynamic'
const MuiProvider = dynamic(() => import('./providers/MuiProvider'), { ssr: false })
const Header = dynamic(() => import('./components/Header'), { ssr: false })
export const metadata = { title: 'AQMS Frontend' }

export default function RootLayout({ children }){
  return (
    <html lang="en">
      <body>
        <MuiProvider>
            <div className="page">
              <Header />

              <main className="container site-main" style={{minHeight:'60vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
                {children}
              </main>

              <footer className="site-footer">
                <div className="container">© {new Date().getFullYear()} Clinic System G2T4</div>
              </footer>
            </div>
        </MuiProvider>
      </body>
    </html>
  )
}
