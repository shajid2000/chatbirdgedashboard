import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ChatWindow from '@/components/chat/ChatWindow'

export default function DashboardPage() {
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  function handleSelectCustomer(id) {
    setSelectedCustomerId(id)
    // On mobile only: collapse the sidebar so the chat takes full screen
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }

  return (
    <DashboardLayout
      selectedCustomerId={selectedCustomerId}
      onSelectCustomer={handleSelectCustomer}
      sidebarOpen={sidebarOpen}
      onToggleSidebar={() => setSidebarOpen((v) => !v)}
    >
      <ChatWindow
        customerId={selectedCustomerId}
        onBack={() => setSidebarOpen(true)}
      />
    </DashboardLayout>
  )
}
