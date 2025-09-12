import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

export function PaginationComponent({
  page,
  setPage,
  next_page,
}: {
  page: number
  next_page: number | null | undefined
  setPage: React.Dispatch<React.SetStateAction<number>>
}) {
  return (
    <Pagination className="w-full">
      <PaginationContent>
        {page > 1 && (
          <>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage(page - 1)}
                size="default"
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink onClick={() => setPage(page - 1)} size="default">
                {page - 1}
              </PaginationLink>
            </PaginationItem>
          </>
        )}
        <PaginationItem>
          <PaginationLink size="default" isActive>
            {page}
          </PaginationLink>
        </PaginationItem>
        {next_page && (
          <>
            <PaginationItem>
              <PaginationLink onClick={() => setPage(page + 1)} size="default">
                {page + 1}
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                onClick={() => setPage(page + 1)}
                size="default"
              />
            </PaginationItem>
          </>
        )}
      </PaginationContent>
    </Pagination>
  )
}
