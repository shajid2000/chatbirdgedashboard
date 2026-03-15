import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ChatWindow from '@/components/chat/ChatWindow'

export default function DashboardPage() {
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)

  return (
    <DashboardLayout
      selectedCustomerId={selectedCustomerId}
      onSelectCustomer={setSelectedCustomerId}
    >
      <ChatWindow customerId={selectedCustomerId} />
    </DashboardLayout>
  )
}
