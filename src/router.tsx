import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage'
import { PrivateRoute } from './components/PrivateRoute/PrivateRoute'
import Clients from './pages/clients/clients'
import ProductPage from './pages/products/products'
import Create_selling from './pages/selling/create_selling'
import ClientDetails from './pages/clients/clientDetails'
export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={'selling'} />} />
      <Route path={'auth'}>
        <Route path={'login'} element={<LoginPage />} />
      </Route>
      <Route path={'selling'} element={<PrivateRoute />}>
        <Route index element={<Create_selling />} />
      </Route>
      <Route path={'clients'} element={<PrivateRoute />}>
        <Route index element={<Clients />} />
        <Route path={'client/:id'} element={<ClientDetails />} />
      </Route>
      <Route path={'products'} element={<PrivateRoute />}>
        <Route index element={<ProductPage />} />
      </Route>
    </Routes>
  )
}
