import { string } from "zod"
import { getProductCount } from "./db/products"
import { getUserSubscriptionTier } from "./db/subscription"

export async function canCreateProduct(userId: string | null) {
  if (userId == null) return false
  const tier = await getUserSubscriptionTier(userId)
  const productCount = await getProductCount(userId)
  return productCount < tier.maxNumberOfProducts
}

export async function canCustomizeBanner(userId: string | null) {
  if (userId == null) return false
  const tier = await getUserSubscriptionTier(userId)
  return tier.canCustomizeBanner
}

