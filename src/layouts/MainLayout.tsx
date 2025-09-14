import { Calendar22 } from '@/components/calendar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { useGetAllBranchesQuery } from '@/store/branch/branch.api'
import { useGetRole } from '@/hooks/use-get-role'
import { ChevronUp, User2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { Package, Store, UserRound } from 'lucide-react'

const HIDE_SIDEBAR_ROUTES = ['/auth/login']

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const role = useGetRole()
  const { data: { data: branches } = {} } = useGetAllBranchesQuery(
    {},
    { skip: role !== 'ceo' }
  )
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const { pathname } = useLocation()

  const hideSidebar = HIDE_SIDEBAR_ROUTES.includes(pathname)

  if (hideSidebar) return children

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="z-30">
        <SidebarHeader>
          <div className="p-2 flex items-center gap-2">
            <img src="/logo.svg" alt="" className="h-6 w-6" />
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="font-semibold text-[14px] leading-[100%]">
                Romay ERP
              </span>
              <span className="text-[12px] leading-[100%]">v1.0</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          {[
            {
              label: 'Asosiy',
              items: [{ title: 'Sotuv', icon: Store, url: '/selling' }],
            },
            {
              label: "Ma'lumotlar",
              items: [
                { title: 'Mijozlar', icon: UserRound, url: '/clients' },
                { title: 'Mahsulotlar', icon: Package, url: '/products' },
              ],
            },
          ].map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        className="data-[active=true]:bg-[#10B981] data-[active=true]:text-white"
                        isActive={item.url === pathname}
                        asChild
                      >
                        <Link to={item.url} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton>
                    <User2 /> Username
                    <ChevronUp className="ml-auto" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  className="w-[--radix-popper-anchor-width]"
                >
                  <DropdownMenuItem>
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="border-b sticky top-0 z-10 bg-white">
          <div className="flex items-center pr-6 justify-between w-full">
            <div className="flex h-16 items-center justify-between px-4 flex-1">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
                <Separator
                  orientation="vertical"
                  className="min-h-4 min-w-0.5"
                />
              </div>
            </div>
            <div className="flex gap-4 items-center">
              <Calendar22 />
              <Select
                onValueChange={(value) => {
                  setSelectedBranch(value)
                }}
                value={selectedBranch}
              >
                <SelectTrigger className="min-w-[150px]">
                  <SelectValue placeholder="Barch Filiallar" />
                </SelectTrigger>
                <SelectContent>
                  {branches?.map((branch) => (
                    <SelectItem key={branch._id} value={branch._id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </header>
        <main className="px-5 py-2">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
