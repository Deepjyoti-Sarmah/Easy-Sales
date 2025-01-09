import { useToast } from "@/hooks/use-toast"
import { productCountryDiscountsSchema } from "@/schemas/products"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, useForm } from "react-hook-form"
import { z } from "zod"

export function CountryDiscountsForm({
  productId,
  countryGroups,
}: {
  productId: string
  countryGroups: {
    id: string
    name: string
    recommendedDiscountPercentage: number | null
    countries: {
      name: string
      code: string
    }[]
    discount?: {
      coupon: string
      discountPercentage: number
    }
  }[]
}) {
  const { toast } = useToast()
  const form = useForm<z.infer<typeof productCountryDiscountsSchema>>({
    resolver: zodResolver(productCountryDiscountsSchema),
    defaultValues: {
      groups: countryGroups.map(group => {
        const discount =
          group.discount?.discountPercentage ??
          group.recommendedDiscountPercentage

        return {
          countryGroupId: group.id,
          coupon: group.discount?.coupon ?? "",
          discountPercentage: discount != null ? discount * 100 : undefined,
        }
      }),
    },
  })

  // async function onSubmit(
  //   values: z.infer<typeof productCountryDiscountsSchema>
  // ) {
  //   const data = await updateCountryDiscounts(productId, values)
  //
  //   if (data.message) {
  //     toast({
  //       title: data.error ? "Erorr" : "Success",
  //       description: data.message,
  //       variant: data.error ? "destructive" : "default",
  //     })
  //   }
  //
  // }

  return (
    <Form>
      <form>
      </form>
    </Form>

  )
}
