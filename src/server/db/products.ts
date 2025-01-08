import { db } from "@/drizzle/db"
import { ProductCustomizationTable, ProductTable } from "@/drizzle/schema"
import { and, eq } from "drizzle-orm"

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

export async function createProduct(data: typeof ProductTable.$inferInsert) {
  const [newProduct] = await db
    .insert(ProductTable)
    .values(data)
    .returning({ id: ProductTable.id, userId: ProductTable.clerkUserId })

  try {
    await db
      .insert(ProductCustomizationTable)
      .values({
        productId: newProduct.id,
      })
      .onConflictDoNothing({
        target: ProductCustomizationTable.productId
      })
  } catch (error) {
    await db.delete(ProductTable).where(eq(ProductTable.id, newProduct.id))
  }

  return newProduct
}

export async function updateProduct(
  data: Partial<typeof ProductTable.$inferInsert>,
  { id, userId }: { id: string; userId: string }
) {

  const { rowCount } = await db
    .update(ProductTable)
    .set(data)
    .where(and(eq(ProductTable.clerkUserId, userId), eq(ProductTable.id, id)))

  return rowCount > 0
}

export async function deleteProduct({
  id,
  userId,
}: {
  id: string,
  userId: string
}) {
  const { rowCount } = await db
    .delete(ProductTable)
    .where(and(eq(ProductTable.id, id), eq(ProductTable.clerkUserId, userId)))

  return rowCount > 0
}
