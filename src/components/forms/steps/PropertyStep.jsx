import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const PropertyStep = () => {
  const { register } = useFormContext();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">🏠 Property Information</h2>
      <div>
        <Label>Property Title</Label>
        <Input {...register("propertyTitle")} />
      </div>
      <div>
        <Label>Property Type</Label>
        <Input {...register("propertyType")} />
      </div>
      <div>
        <Label>City, State</Label>
        <Input {...register("cityState")} />
      </div>
      <div>
        <Label>Full Address</Label>
        <Input {...register("fullAddress")} />
      </div>
      <div>
        <Label>Description</Label>
        <Input {...register("description")} />
      </div>
      <div>
        <Label>Year Built</Label>
        <Input {...register("yearBuilt")} />
      </div>
      <div>
        <Label>Property Size (sq ft)</Label>
        <Input type="number" {...register("propertySize", { valueAsNumber: true })} />
      </div>
      <div>
        <Label>Number of Units</Label>
        <Input type="number" {...register("numberOfUnits", { valueAsNumber: true })} />
      </div>
    </div>
  );
};
