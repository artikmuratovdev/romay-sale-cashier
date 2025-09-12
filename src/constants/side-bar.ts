/* eslint-disable @typescript-eslint/no-explicit-any */
// sidebar-groups.ts
import { UserRound, SquareCheckBig, Package, Store, Import } from 'lucide-react'

export type Role =
  
   'sale_cashier' 

export interface SidebarItem {
  title: string
  icon: any
  url: string
}

export interface SidebarGroup {
  label: string
  items: SidebarItem[]
}

export const getSidebarGroups = (role: Role): SidebarGroup[] => {
  switch (role) {
    case 'sale_cashier':
      return [
        {
          label: 'Asosiy',
          items: [
            { title: 'Sotuv', icon: Store, url: '/selling' },
            { title: 'Qabul qilish', icon: Import, url: '/accept' },
          ],
        },
        {
          label: "Ma'lumotlar",
          items: [
            { title: 'Mijozlar', icon: UserRound, url: '/clients' },
            { title: 'Buyurtmalar', icon: SquareCheckBig, url: '/orders' },
            { title: 'Mahsulotlar', icon: Package, url: '/products' },
          ],
        },
      ]
  }
}
