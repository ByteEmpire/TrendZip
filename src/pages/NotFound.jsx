import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center text-center px-4">
      <div>
        <p className="font-display text-8xl text-tz-gold font-light mb-4">404</p>
        <h1 className="heading-md mb-3">Page Not Found</h1>
        <p className="body-sm mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="btn-primary">Back to Home</Link>
      </div>
    </div>
  )
}