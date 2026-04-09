import { Navigate, useLocation } from "react-router-dom"
import useAuth from "../context/useAuth"

function FullPageMessage({ text }) {
  return (
    <div className="screen-center">
      <p>{text}</p>
    </div>
  )
}

export default function ProtectedRoute({ children }) {
  const location = useLocation()
  const { isLoading, isAuthenticated } = useAuth()

  if (isLoading) {
    return <FullPageMessage text="Checking session..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}
