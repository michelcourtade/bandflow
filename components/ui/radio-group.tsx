"use client"

import * as React from "react"
import { Circle } from "lucide-react"

import { cn } from "@/lib/utils"

function RadioGroup({
    className,
    ...props
}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="radio-group"
            className={cn("grid gap-3", className)}
            {...props}
        />
    )
}

function RadioGroupItem({
    className,
    children,
    ...props
}: React.ComponentProps<"button"> & { checked?: boolean }) {
    return (
        <button
            type="button"
            data-slot="radio-group-item"
            data-state={props.checked ? "checked" : "unchecked"}
            className={cn(
                "aspect-square h-4 w-4 shrink-0 rounded-full border border-zinc-800 text-indigo-600 shadow-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-indigo-600 data-[state=checked]:bg-indigo-600",
                className
            )}
            {...props}
        >
            <div className="flex items-center justify-center">
                <Circle className="h-2 w-2 fill-current text-white opacity-0 data-[state=checked]:opacity-100" data-state={props.checked ? "checked" : "unchecked"} />
            </div>
        </button>
    )
}

export { RadioGroup, RadioGroupItem }
