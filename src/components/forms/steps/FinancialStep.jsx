import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";

export const FinancialStep = () => {
  const { register } = useFormContext();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">💰 Financial Details</h2>
      <Input placeholder="Purchase Price" type="number" {...register("purchasePrice", { valueAsNumber: true })} />
      <Input placeholder="Tokenization Value" type="number" {...register("tokenizationValue", { valueAsNumber: true })} />
      <Input placeholder="Minimum Investment" type="number" {...register("minInvestment", { valueAsNumber: true })} />
      <Input placeholder="Annual Yield (%)" type="number" {...register("annualYield", { valueAsNumber: true })} />
      <Input placeholder="Monthly Revenue ($)" type="number" {...register("monthlyRevenue", { valueAsNumber: true })} />
      <Input placeholder="Monthly Expenses ($)" type="number" {...register("monthlyExpenses", { valueAsNumber: true })} />
    </div>
  );
};
