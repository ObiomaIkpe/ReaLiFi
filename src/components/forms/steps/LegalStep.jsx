import { useFormContext } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";

export const LegalStep = () => {
  const { register } = useFormContext();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">⚖️ Legal & Compliance</h2>
      <div className="flex items-center space-x-2">
        <Checkbox {...register("acceptedTerms")} /> <span>I accept terms and conditions.</span>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox {...register("acceptedPrivacy")} /> <span>I accept the privacy policy.</span>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox {...register("acceptedCompliance")} /> <span>I confirm I meet investor compliance.</span>
      </div>
    </div>
  );
};
