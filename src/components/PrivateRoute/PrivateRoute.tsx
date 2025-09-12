import { useUserQuery } from '@/store/auth/auth.api'
import { getAuthToken } from '@/utils/auth'
import { CheckRole } from '@/utils/checkRole'
import { useGetRole } from '@/hooks/use-get-role'
import { Loader2 } from 'lucide-react'
import { Navigate, Outlet } from 'react-router-dom'
// import { useEffect } from 'react'

export const PrivateRoute = () => {
  const { data: userData, isLoading: userLoading, isError } = useUserQuery()
  const token = getAuthToken()
  const role = useGetRole()

  if (userLoading)
    return (
      <div className="flex fixed z-50 top-0 left-0 bg-white/50 items-center justify-center  w-full h-screen">
        <Loader2 className="animate-spin" />
      </div>
    )
  if (isError || !userData || !token || !CheckRole(role, ['sale_cashier']))
    return <Navigate to={'/auth/login'} />

  return <Outlet />
}
