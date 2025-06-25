import { Inter } from 'next/font/google'
import './style.css'

export const metadata = {
  title: 'SVG Shaders',
  description: 'Composable SVG Shaders with React',
}

const inter = Inter({
  weights: [400, 500, 600],
  styles: ['normal'],
  subsets: ['latin-ext'],
})

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <body className={inter.className}>
        
        {children}
        <footer>
          <p>
            Created by{' '}
            <a href='https://twitter.com/shuding_' target='_blank'>
              Shu
            </a>
            , source code on{' '}
            <a href='https://github.com/shuding/svg-shaders' target='_blank'>
              GitHub
            </a>
            .
          </p>
        </footer>
      </body>
    </html>
  )
}
