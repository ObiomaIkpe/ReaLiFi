import MultiStepForm from "../components/forms/MultiStepForm";

export default function Submit() {
  return (
    <div className="min-h-screen bg-main pt-24 flex justify-center text-text-primary">
      <div className="w-full max-w-3xl">
        <MultiStepForm />
      </div>
    </div>
  );
}
