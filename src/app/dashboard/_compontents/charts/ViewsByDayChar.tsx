
export function ViewsByDayChart({
  chartData,
}: {
  chartData: { data: string; views: number }[]
}) {
  const chartConfig = {
    views: {
      label: "Visitors",
      color: "hsl(var(--accent))",
    },
  }

  if (chartData.length === 0) {
    return (
      <p className="flex items-center justify-center text-muted-foreground min-h-[150px] max-h-[250px]">
        No data available
      </p>
    )
  }

  return (
    <>
      ViewsByDayChart
    </>

  )
}
