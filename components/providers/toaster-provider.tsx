"use client"

import * as React from "react"
import { Toaster } from "sonner"

export function ToasterProvider() {
    return (
        <Toaster
            position="bottom-right"
            toastOptions={{
                style: {
                    background: '#09090b',
                    border: '1px solid #27272a',
                    color: '#fafafa',
                },
            }}
        />
    )
}
