import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Sale from './tabs/Sale'
import Sales_assistant from './tabs/Sales_assistant'
import { useGetUser } from '@/hooks/useGetUser'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { setSalesBalance } from '@/store/slice/Branch_sales_balance'
import { useGetBranchByIdQuery } from '@/store/branch/branch.api'

const Selling = () => {
  const me = useGetUser()
  const { data: branchData } = useGetBranchByIdQuery(
    me?.branch_id._id as string,
    {
      refetchOnMountOrArgChange: true,
      skip: !me,
    }
  )
  const dispatch = useDispatch()

  useEffect(() => {
    if (branchData) dispatch(setSalesBalance(branchData.data.sales_balance))
  }, [branchData])
  return (
    <div>
      <Tabs defaultValue="sale" className="mt-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sale">Sotuv</TabsTrigger>
          <TabsTrigger value="assistants">Sotuvchilar</TabsTrigger>
        </TabsList>
        <TabsContent value="sale">
          <Sale />
        </TabsContent>
        <TabsContent value="assistants">
          <Sales_assistant />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Selling
