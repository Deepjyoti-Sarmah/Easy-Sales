import { PageWithBackButton } from "@/app/dashboard/_compontents/PageWithBackButton"
import { getProduct } from "@/server/db/products"
import { auth } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"

export default async function EditProductPage({
  params: { productId },
  searchParams: { tab = "details" },
}: {
  params: { productId: string }
  searchParams: { tab?: string }
}) {
  const { userId, redirectToSignIn } = await auth()
  if (userId == null) return redirectToSignIn()

  const product = await getProduct({ id: productId, userId })
  if (product == null) return notFound()

  return (
    <PageWithBackButton
      backButtonHref="/dashboard/products"
      pageTitle="Edit Product"
    >
      <Tabs>
      </Tabs>
    </PageWithBackButton>

  )
}
