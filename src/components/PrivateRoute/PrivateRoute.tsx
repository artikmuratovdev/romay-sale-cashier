import { useUserQuery } from '@/store/auth/auth.api'
import { clearAuthTokens, getAuthToken } from '@/utils/auth'
import { Loader2 } from 'lucide-react'
import { Navigate, Outlet } from 'react-router-dom'
// import { useEffect } from 'react'

export const PrivateRoute = () => {
  const { data: userData, isLoading: userLoading, isError } = useUserQuery()
  const token = getAuthToken()

  if (userLoading)
    return (
      <div className="fixed z-50 top-0 left-0 bg-white flex items-center justify-center w-full h-screen">
        <Loader2 className="animate-spin" />
      </div>
    )

  if (isError || !userData || !token) {
    clearAuthTokens()
    return <Navigate to={'/auth/login'} />
  }

  return <Outlet />
}
