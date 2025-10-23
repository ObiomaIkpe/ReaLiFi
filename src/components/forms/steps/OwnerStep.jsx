import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const OwnerStep = () => {
  const { register } = useFormContext();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">👤 Owner Information</h2>
      <Input placeholder="Full Name" {...register("fullName")} />
      <Input placeholder="Company Name" {...register("companyName")} />
      <Input placeholder="Email Address" type="email" {...register("email")} />
      <Input placeholder="Phone Number" {...register("phone")} />
      <Input type="number" placeholder="Years of Experience" {...register("yearsExperience", { valueAsNumber: true })} />
    </div>
  );
};
