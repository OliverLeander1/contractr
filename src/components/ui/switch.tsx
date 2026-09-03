"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 items-center rounded-full border outline-none transition-colors duration-150",
        "focus-visible:ring-2 focus-visible:ring-[#1e3a2a]/30 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-[state=unchecked]:bg-[#ede9e1] data-[state=unchecked]:border-[#d8d3c8] data-[state=unchecked]:hover:border-gray-300",
        "data-[state=checked]:bg-[#1e3a2a] data-[state=checked]:border-[#1e3a2a]",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-3.5 translate-x-[3px] rounded-full bg-white shadow-sm transition-transform duration-150",
          "data-[state=checked]:translate-x-[19px]"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
