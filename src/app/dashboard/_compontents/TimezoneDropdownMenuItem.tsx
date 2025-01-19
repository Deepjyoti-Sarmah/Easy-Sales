import { createURL } from "@/lib/utils"
import { DropdownMenuItem } from "@radix-ui/react-dropdown-menu"
import Link from "next/link"

export function TimezoneDropdownMenuItem({
  searchParams,
}: {
  searchParams: Record<string, string>
}) {
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  return (
    <DropdownMenuItem asChild>
      <Link
        href={createURL("/dashboard/analytics", searchParams, {
          timezone: userTimezone,
        })}
      >
        {userTimezone}
      </Link>
    </DropdownMenuItem>
  )
}
