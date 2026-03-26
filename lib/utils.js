import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** name > phone > email > Guest #<short-id> */
export function customerDisplayName(customer) {
  if (customer.name) return customer.name
  if (customer.phone) return customer.phone
  if (customer.email) return customer.email
  return `Guest #${customer.id.replace(/-/g, '').slice(0, 6)}`
}

export function customerInitials(customer) {
  const label = customerDisplayName(customer)
  if (label.startsWith('Guest #')) return label.slice(6, 8).toUpperCase()
  return label.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}
