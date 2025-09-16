import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Sale from './tabs/Sale'
import Sales_assistant from './tabs/Sales_assistant'

const Selling = () => {
  return (
    <div>
      <Tabs defaultValue="sale">
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
