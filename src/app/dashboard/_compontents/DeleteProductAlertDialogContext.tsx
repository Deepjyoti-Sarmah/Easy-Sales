"use client"

import { AlertDialogFooter, AlertDialogHeader } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@radix-ui/react-alert-dialog"
import { useTransition } from "react"

export function DeleteProductAlertDialogContent({ id }: { id: string }) {
  const [isDeletePending, startDeleteTransition] = useTransition()
  const { toast } = useToast()

  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
        <AlertDialogDescription>
          This action cannot be undone. This will permanently delete this product.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction
          onClick={() => {
            startDeleteTransition(async () => {
              const data = await deleteProduct(id)
              if (data.message) {
                toast({
                  title: data.error ? "Error" : "Success",
                  description: data.message,
                  variant: data.error ? "destructive" : "default",
                })
              }
            })
          }}
          disabled={isDeletePending}
        >
          Delete
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  )
}
