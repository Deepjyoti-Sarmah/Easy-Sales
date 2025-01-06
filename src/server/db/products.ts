import { db } from "@/drizzle/db"

export function getProductCountryGroups({
  productId,
  userId,
}: {
  productId: string
  userId: string
}) {

  // return cacheFn({ productId, userId })
}

export function getProducts(
  userId: string,
  { limit }: { limit?: number } = {}
) {
  return db.query.ProductTable.findMany({
    where: ({ clerkUserId }, { eq }) => eq(clerkUserId, userId),
    orderBy: ({ createdAt }, { desc }) => desc(createdAt),
    limit
  })
}
