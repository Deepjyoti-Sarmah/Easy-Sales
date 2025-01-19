import { db } from "@/drizzle/db"
import { CountryTable, ProductTable, ProductViewTable } from "@/drizzle/schema"
import { CACHE_TAGS, dbCache, getGlobalTag, getIdTag, getUserTag, revalidateDbCache } from "@/lib/cache"
import { startOfDay } from "date-fns"
import { and, count, desc, eq, gte, sql } from "drizzle-orm"
import { tz } from "@date-fns/tz"

export function getProductViewCount(userId: string, startDate: Date) {
  const cacheFn = dbCache(getProductViewCountInternal, {
    tags: [getUserTag(userId, CACHE_TAGS.productViews)]
  })

  return cacheFn(userId, startDate)
}

export function getViewsByCountryChartData({
  timezone,
  productId,
  userId,
  interval,
}: {
  timezone: string
  productId?: string
  userId: string
  interval: (typeof CHART_INTERVALS)[keyof typeof CHART_INTERVAL]
}) {
  const cacheFn = dbCache(getViewsByCountryChartDataInternal, {
    tags: [
      getUserTag(userId, CACHE_TAGS.productViews),
      productId == null
        ? getUserTag(userId, CACHE_TAGS.products)
        : getIdTag(productId, CACHE_TAGS.products),
      getGlobalTag(CACHE_TAGS.countries),
    ],
  })

  return cacheFn({
    timezone,
    productId,
    userId,
    interval,
  })
}

export function getViewByPPPChartData({
  timezone,
  productId,
  userId,
  interval,
}: {
  timezone: string
  productId?: string
  userId: string
  interval: (typeof CHART_INTERVALS)[keyof typeof CHART_INTERVALS]
}) {
  const cacheFn = dbCache(getViewsByCountryChartDataInternal, {
    tags: [
      getUserTag(userId, CACHE_TAGS.productViews),
      productId == null
        ? getUserTag(userId, CACHE_TAGS.products)
        : getIdTag(productId, CACHE_TAGS.products),
      getGlobalTag(CACHE_TAGS.countries),
      getGlobalTag(CACHE_TAGS.countryGroups),
    ],
  })

  return cacheFn({
    timezone,
    productId,
    userId,
    interval,
  })
}

export function getViewsByDayChartData({
  timezone,
  productId,
  userId,
  interval,
}: {
  timezone: string
  productId?: string
  userId: string
  interval: (typeof CHART_INTERVALS)[keyof typeof CHART_INTERVALS]
}) {
  const cacheFn = dbCache(getViewsByDayChartDataInternal, {
    tags: [
      getUserTag(userId, CACHE_TAGS.productViews),
      productId == null
        ? getUserTag(userId, CACHE_TAGS.products)
        : getIdTag(productId, CACHE_TAGS.products),
    ],
  })

  return cacheFn({
    timezone,
    productId,
    userId,
    interval,
  })
}


export async function createProductView({
  productId,
  countryId,
  userId,
}: {
  productId: string
  countryId?: string
  userId: string
}) {
  const [newRow] = await db
    .insert(ProductViewTable)
    .values({
      productId: productId,
      visitedAt: new Date(),
      countryId: countryId,
    })
    .returning({ id: ProductViewTable.id })

  if (newRow != null) {
    revalidateDbCache({ tag: CACHE_TAGS.productViews, userId, id: newRow.id })
  }
}

async function getProductViewCountInternal(userId: string, startDate: Date) {
  const counts = await db
    .select({ priceViewCount: count() })
    .from(ProductViewTable)
    .innerJoin(ProductTable, eq(ProductTable.id, ProductViewTable.productId))
    .where(
      and(
        eq(ProductTable.clerkUserId, userId),
        gte(ProductViewTable.visitedAt, startDate)
      )
    )

  return counts[0]?.priceViewCount ?? 0
}

async function getViewsByCountryChartDataInternal({
  timezone,
  productId,
  userId,
  interval,
}: {
  timezone: string
  productId?: string
  userId: string
  interval: (typeof CHART_INTERVALS)[keyof typeof CHART_INTERVALS]
}) {
  const startDate = startOfDay(interval.startDate, { in: tz(timezone) })
  const productsSq = getProductSubQuery(userId, productId)
  return await db
    .with(productsSq)
    .select({
      views: count(ProductViewTable.visitedAt),
      countryName: CountryTable.name,
      countryCode: CountryTable.code,
    })
    .from(ProductViewTable)
    .innerJoin(productsSq, eq(productsSq.id, ProductViewTable.productId))
    .innerJoin(CountryTable, eq(CountryTable.id, ProductViewTable.countryId))
    .where(
      gte(
        sql`${ProductViewTable.visitedAt} AT TIME ZONE ${timezone}`.inlineParams(),
        startDate
      )
    )
    .groupBy(({ countryCode, countryName }) => [countryCode, countryName])
    .orderBy(({ views }) => desc(views))
    .limit(25)
}


