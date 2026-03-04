"use client"

import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

// A simple fallback Select component that doesn't rely on external Radix UI
// until it can be correctly installed in the container environment.

export function Select({ children, value, onValueChange, defaultValue, disabled }: any) {
    const [val, setVal] = React.useState(value || defaultValue)
    const [isOpen, setIsOpen] = React.useState(false)
    const ref = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        if (value !== undefined) setVal(value)
    }, [value])

    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleSelect = (newVal: string) => {
        if (disabled) return
        setVal(newVal)
        onValueChange?.(newVal)
        setIsOpen(false)
    }

    return (
        <div ref={ref} className="relative w-full group">
            {React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child as any, {
                        selectedValue: val,
                        onSelect: handleSelect,
                        isOpen,
                        setIsOpen,
                        disabled
                    })
                }
                return child
            })}
        </div>
    )
}

export function SelectTrigger({ className, children, selectedValue, isOpen, setIsOpen, disabled }: any) {
    return (
        <div
            onClick={() => !disabled && setIsOpen(!isOpen)}
            className={cn(
                "flex h-12 w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 transition-all",
                disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-zinc-700",
                className
            )}
        >
            {React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    // Pass selectedValue down to SelectValue
                    return React.cloneElement(child as any, { selectedValue })
                }
                return child
            })}
            <ChevronDown className="h-4 w-4 opacity-50" />
        </div>
    )
}

export function SelectValue({ placeholder, selectedValue, children }: any) {
    const displayValue = selectedValue
        ? selectedValue.charAt(0).toUpperCase() + selectedValue.slice(1)
        : placeholder

    return (
        <span className="truncate">
            {displayValue}
        </span>
    )
}

export function SelectContent({ children, selectedValue, onSelect, isOpen, className }: any) {
    if (!isOpen) return null

    return (
        <div className={cn(
            "absolute z-50 mt-1 w-full min-w-[8rem] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 p-1 text-zinc-300 shadow-xl animate-in fade-in-0 zoom-in-95",
            className
        )}>
            {React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child as any, { selectedValue, onSelect })
                }
                return child
            })}
        </div>
    )
}

export function SelectItem({ value, children, selectedValue, onSelect, className }: any) {
    const isSelected = selectedValue === value
    return (
        <div
            onClick={(e) => {
                e.stopPropagation()
                onSelect?.(value)
            }}
            className={cn(
                "relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 pl-8 pr-2 text-sm outline-none transition-colors",
                isSelected ? "bg-zinc-800 text-white" : "hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200",
                className
            )}
        >
            {isSelected && (
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    <Check className="h-4 w-4 text-indigo-500" />
                </span>
            )}
            {children}
        </div>
    )
}
