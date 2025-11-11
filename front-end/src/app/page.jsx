import { redirect } from 'next/navigation'

/**
 * Home page
 *
 * Redirects to the login page. Kept as a small landing route to centralize
 * initial navigation logic for unauthenticated users.
 */
export default function Home(){
  redirect('/auth/login')
}
