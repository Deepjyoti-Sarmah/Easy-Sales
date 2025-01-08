import { db } from "@/drizzle/db"
import { ProductCustomizationTable, ProductTable } from "@/drizzle/schema"
import { CACHE_TAGS, dbCache, getGlobalTag, getIdTag, getUserTag, revalidateDbCache } from "@/lib/cache"
import { removeTrailingSlash } from "@/lib/utils"
import { and, eq, count } from "drizzle-orm"

export function getProductCountryGroups({
  productId,
  userId,
}: {
  productId: string
  userId: string
}) {
  const cacheFn = dbCache(getProductCountryGroupsInternal, {
    tags: [
      getIdTag(productId, CACHE_TAGS.products),
      getGlobalTag(CACHE_TAGS.countries),
      getGlobalTag(CACHE_TAGS.countryGroups),
    ],
  })

  return cacheFn({ productId, userId })
}

export function getProductCustomization({
  productId,
  userId
}: {
  productId: string
  userId: string
}) {
  const cacheFn = dbCache(getProductCustomizationInternal, {
    tags: [getIdTag(productId, CACHE_TAGS.products)]
  })

  return cacheFn({ productId, userId })
}

export function getProducts(userId: string,
  { limit }: { limit?: number } = {}
) {
  const cacheFn = dbCache(getProductsInternal, {
    tags: [getUserTag(userId, CACHE_TAGS.products)],
  })

  return cacheFn(userId, { limit })
}

export function getProduct({ id, userId }: { id: string; userId: string }) {
  const cacheFn = dbCache(getProductInternal, {
    tags: [getIdTag(id, CACHE_TAGS.products)],
  })

  return cacheFn({ id, userId })
}

export function getProductCount(userId: string) {
  const cacheFn = dbCache(getProductCountInternal, {
    tags: [getUserTag(userId, CACHE_TAGS.products)],
  })
  return cacheFn(userId)
}

export function getProductForBanner({
  id,
  countryCode,
  url,
}: {
  id: string,
  countryCode: string
  url: string
}) {
  const cacheFn = dbCache(getProductForBannerInternal, {
    tags: [
      getIdTag(id, CACHE_TAGS.products),
      getGlobalTag(CACHE_TAGS.countries),
      getGlobalTag(CACHE_TAGS.countryGroups),
    ],
  })

  return cacheFn({
    id,
    countryCode,
    url,
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

  revalidateDbCache({
    tag: CACHE_TAGS.products,
    userId: newProduct.userId,
    id: newProduct.id,
  })

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

async function getProductCountryGroupsInternal({
  userId,
  productId,
}: {
  userId: string
  productId: string
}) {
  const product = await getProduct({ id: productId, userId })
  if (product == null) return []

  const data = await db.query.CountryGroupTable.findMany({
    with: {
      countries: {
        columns: {
          name: true,
          code: true,
        },
      },
      countryGroupDiscounts: {
        columns: {
          coupon: true,
          discountPercentage: true,
        },
        where: ({ productId: id }, { eq }) => eq(id, productId),
        limit: 1,
      }
    },
  })

  return data.map(group => {
    return {
      id: group.id,
      name: group.name,
      recommendedDiscountPercentage: group.recommendedDiscountPercentage,
      countries: group.countries,
      disconnect: group.countryGroupDiscounts.at(0),
    }
  })
}

async function getProductCustomizationInternal({
  userId,
  productId
}: {
  userId: string
  productId: string
}) {
  const data = await db.query.ProductTable.findFirst({
    where: ({ id, clerkUserId }, { and, eq }) =>
      and(eq(id, productId), eq(clerkUserId, userId)),
    with: {
      productCustomization: true
    },
  })

  return data?.productCustomization
}

function getProductsInternal(userId: string, { limit }: { limit?: number }) {
  return db.query.ProductTable.findMany({
    where: ({ clerkUserId }, { eq }) => eq(clerkUserId, userId),
    orderBy: ({ createdAt }, { desc }) => desc(createdAt),
    limit,
  })
}

function getProductInternal({ id, userId }: { id: string; userId: string }) {
  return db.query.ProductTable.findFirst({
    where: ({ clerkUserId, id: idCol }, { eq, and }) =>
      and(eq(clerkUserId, userId), eq(idCol, id)),
  })
}

async function getProductCountInternal(userId: string) {
  const counts = await db
    .select({ productCount: count() })
    .from(ProductTable)
    .where(eq(ProductTable.clerkUserId, userId))

  return counts[0]?.productCount ?? 0
}

async function getProductForBannerInternal({
  id,
  countryCode,
  url,
}: {
  id: string
  countryCode: string
  url: string
}) {
  const data = await db.query.ProductTable.findFirst({
    where: ({ id: idCol, url: urlCol }, { eq, and }) =>
      and(eq(idCol, id), eq(urlCol, removeTrailingSlash(url))),
    columns: {
      id: true,
      clerkUserId: true,
    },
    with: {
      productCustomization: true,
      countryGroupDiscounts: {
        columns: {
          coupon: true,
          discountPercentage: true,
        },
        with: {
          countryGroup: {
            columns: {},
            with: {
              countries: {
                columns: {
                  id: true,
                  name: true,
                },
                limit: 1,
                where: ({ code }, { eq }) => eq(code, countryCode),
              },
            },
          },
        },
      },
    },
  })

  const discount = data?.countryGroupDiscounts.find(
    discount => discount.countryGroup.countries.length > 0
  )
  const country = discount?.countryGroup.countries[0]
  const product =
    data == null || data.productCustomization == null
      ? undefined
      : {
        id: data.id,
        clerkUserId: data.clerkUserId,
        customization: data.productCustomization,
      }

  return {
    product,
    country,
    discount:
      discount == null
        ? undefined
        : {
          coupon: discount.coupon,
          percentage: discount.discountPercentage,
        },
  }
}
