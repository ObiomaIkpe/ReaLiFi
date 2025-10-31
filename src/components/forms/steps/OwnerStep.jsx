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
      <Input 
  placeholder="Email Address" 
  type="email" 
  {...register("email", {
    required: "Email is required",
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: "Invalid email address"
    }
  })} 
/>
{errors.email && (
  <span className="text-red-500 text-sm mt-1 block">
    {errors.email.message}
  </span>
)}
      <Input placeholder="Phone Number" {...register("phone")} />
      <Input type="number" placeholder="Years of Experience" {...register("yearsExperience", { valueAsNumber: true })} />
    </div>
  );
};
