import { useGetBranchByIdQuery } from '@/store/branch/branch.api'
import { useGetUser } from '@/hooks/useGetUser'

const getSalesBalance = () => {
  const me = useGetUser()
    const { data: branchData } = useGetBranchByIdQuery(
      me?.branch_id._id as string,
      {
        refetchOnMountOrArgChange: true,
        skip: !me,
      }
    )
  return branchData?.data?.sales_balance
}

export default getSalesBalance