import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useDropzone } from "react-dropzone";
import { Loader2, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { createAsset } from "@/utils/createAsset";
import { REAL_ESTATE_DAPP_ADDRESS, REAL_ESTATE_DAPP } from "@/config/contract.config";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import toast from "react-hot-toast";

export default function MultiStepForm() {
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [metadataUri, setMetadataUri] = useState("");
  const totalSteps = 5;

  const BACKEND_URL = "http://localhost:3000";

  const { address, isConnected } = useAccount();
  const { writeContract, data: registerHash, isPending: isRegisterPending } = useWriteContract();
  const { isLoading: isRegisterConfirming, isSuccess: isRegisterSuccess } = useWaitForTransactionReceipt({ 
    hash: registerHash 
  });

  const {
    register,
    control,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm({
    defaultValues: { images: [], documents: [] },
    mode: "onChange",
  });

  // Check if user is registered as seller
  const { data: isSeller, isLoading: checkingStatus, refetch } = useReadContract({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    functionName: 'sellers',
    args: [address],
    enabled: !!address,
  });

  const nextStep = async () => {
    let fieldsToValidate = [];
    
    // Define fields to validate for each step
    switch(step) {
      case 1:
        fieldsToValidate = ["propertyTitle", "propertyType", "cityState", "description"];
        break;
      case 2:
        fieldsToValidate = ["fullName", "email", "phone"];
        break;
      case 3:
        fieldsToValidate = ["purchasePrice", "tokenizationValue", "monthlyRevenue", "monthlyExpenses"];
        break;
      default:
        fieldsToValidate = [];
    }

    if (fieldsToValidate.length > 0) {
      const isValid = await trigger(fieldsToValidate);
      if (!isValid) return;
    }

    setStep((s) => Math.min(s + 1, totalSteps));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  // Handle seller registration
  const handleRegisterSeller = async () => {
    try {
      toast.loading('Registering as seller...', { id: 'register' });
      
      writeContract({
        address: REAL_ESTATE_DAPP_ADDRESS,
        abi: REAL_ESTATE_DAPP,
        functionName: 'registerSeller',
      });
    } catch (error) {
      toast.error(`Failed to register: ${error.message}`, { id: 'register' });
      console.error(error);
    }
  };

  // Refetch seller status when registration is successful
  React.useEffect(() => {
    if (isRegisterSuccess) {
      toast.success('✅ Successfully registered as seller!', { id: 'register' });
      refetch();
    }
  }, [isRegisterSuccess, refetch]);

  const uploadFileToIPFS = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${BACKEND_URL}/pinata/upload-file`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload ${file.name}`);
    }

    const result = await response.json();
    console.log(result);

    return result.ipfsHash;
  };

  const onSubmit = async (data) => {
    setUploading(true);
    setUploadStatus("Uploading images to IPFS...");

    try {
      // Upload images to IPFS and get their hashes
      const imageHashes = [];
      for (const file of data.images || []) {
        setUploadStatus(`Uploading ${file.name}...`);
        const hash = await uploadFileToIPFS(file);
        imageHashes.push({
          name: file.name,
          ipfsHash: hash,
          url: `https://gateway.pinata.cloud/ipfs/${hash}`
        });
      }

      setUploadStatus("Uploading documents to IPFS...");
      
      // Upload documents to IPFS and get their hashes
      const documentHashes = [];
      for (const file of data.documents || []) {
        setUploadStatus(`Uploading ${file.name}...`);
        const hash = await uploadFileToIPFS(file);
        documentHashes.push({
          name: file.name,
          ipfsHash: hash,
          url: `https://gateway.pinata.cloud/ipfs/${hash}`
        });
      }

      setUploadStatus("Creating metadata...");

      // Create lightweight metadata with IPFS hashes only
      const metadata = {
        propertyDetails: {
          title: data.propertyTitle,
          type: data.propertyType,
          location: data.cityState,
          description: data.description,
        },
        ownerInformation: {
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
        },
        financialDetails: {
          purchasePrice: data.purchasePrice,
          tokenizationValue: data.tokenizationValue,
          monthlyRevenue: data.monthlyRevenue,
          monthlyExpenses: data.monthlyExpenses,
        },
        media: {
          images: imageHashes,
          documents: documentHashes,
        },
        legal: {
          acceptTerms: data.acceptTerms,
          confirmOwnership: data.confirmOwnership,
        },
        timestamp: new Date().toISOString(),
      };

      setUploadStatus("Uploading metadata to IPFS...");

      const response = await fetch(`${BACKEND_URL}/pinata/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(metadata),
      });

      if (!response.ok) {
        throw new Error("Metadata upload failed");
      }

      const result = await response.json();
      
      setMetadataUri(result.uri);
      setUploadStatus("Upload successful! All assets on IPFS.");

      setUploadStatus("Saving property to database...");
      
      const saveResponse = await fetch(`${BACKEND_URL}/assets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ipfsMetadataUrl: result.uri
        }),
      });

      if (!saveResponse.ok) {
        throw new Error("Failed to save property to database");
      }

      const savedProperty = await saveResponse.json();
      console.log("Property saved to database:", savedProperty.ipfsMetadataUrl);

      // Extract the URI and tokenization value
      const metadataURI = result.uri;
      const tokenizationValue = data.tokenizationValue;
      
      setUploadStatus("Creating asset on blockchain...");
      
      // Call createAsset with the URI and tokenization value
      const txHash = await createAsset(metadataURI, tokenizationValue);
      
      console.log("Asset created on blockchain! Transaction hash:", txHash);
      setUploadStatus("Asset successfully created on blockchain!");
      
      console.log("Metadata URI:", result.uri);
      console.log("Tokenization Value:", tokenizationValue);
      console.log("Images:", imageHashes);
      console.log("Documents:", documentHashes);
      
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus(`Error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const stepVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  // Show wallet connection prompt
  if (!isConnected) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#121317] px-4">
        <Card className="w-full max-w-md shadow-[0_4px_15px_rgba(0,0,0,0.3)] border-0 rounded-2xl bg-[#111216]">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center bg-[#CAAB5B]/10">
              <AlertCircle className="w-10 h-10 text-[#CAAB5B]" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-[#E1E2E2]">Wallet Not Connected</h2>
            <p className="mb-6 text-[#6D6041]">
              Please connect your wallet to access the property tokenization portal.
            </p>
            <p className="text-sm text-[#6D6041]">
              Use the "Connect Wallet" button in the navigation bar.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading while checking seller status
  if (checkingStatus) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#121317]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#CAAB5B] mx-auto mb-4" />
          <p className="text-[#6D6041]">Checking seller status...</p>
        </div>
      </div>
    );
  }

  // Show seller registration if not registered
  if (!isSeller) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#121317] px-4">
        <Card className="w-full max-w-2xl shadow-[0_4px_15px_rgba(0,0,0,0.3)] border-0 rounded-2xl overflow-hidden bg-[#111216]">
          <div className="text-white p-6 bg-gradient-to-br from-[#CAAB5B] to-[#9A8245]">
            <h1 className="text-2xl font-bold">Seller Registration Required</h1>
          </div>
          <CardContent className="p-8">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center bg-[#CAAB5B]/10">
                <ShieldCheck className="w-12 h-12 text-[#CAAB5B]" />
              </div>
              <h2 className="text-2xl font-bold mb-4 text-[#E1E2E2]">Register as a Seller</h2>
              <p className="mb-6 text-lg text-[#6D6041]">
                You need to register as a seller before you can create and list real estate assets on our platform.
              </p>
              
              <div className="rounded-2xl p-6 mb-6 text-left border bg-[#CAAB5B]/5 border-[#2C2C2C]">
                <h3 className="font-semibold mb-3 text-[#CAAB5B]">What you'll get:</h3>
                <ul className="space-y-3 text-[#E1E2E2]">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0 text-emerald-500" />
                    <span>Ability to tokenize and list your real estate properties</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0 text-emerald-500" />
                    <span>Access to a global marketplace of investors</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0 text-emerald-500" />
                    <span>Secure blockchain-verified transactions</span>
                  </li>
                </ul>
              </div>

              <Button
                onClick={handleRegisterSeller}
                disabled={isRegisterPending || isRegisterConfirming}
                className="px-8 py-6 text-lg font-semibold text-black transition-all rounded-2xl hover:opacity-90 disabled:opacity-50 bg-[#CAAB5B]"
                size="lg"
              >
                {isRegisterPending || isRegisterConfirming ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {isRegisterPending ? 'Confirm in wallet...' : 'Registering...'}
                  </>
                ) : (
                  'Register as Seller'
                )}
              </Button>

              {(isRegisterPending || isRegisterConfirming) && (
                <p className="text-sm mt-4 text-[#6D6041]">
                  Please confirm the transaction in your wallet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show the main form if registered
  return (
    <div className="flex justify-center items-center min-h-screen bg-[#121317] px-4 py-10">
      <Card className="w-full max-w-3xl shadow-[0_4px_15px_rgba(0,0,0,0.3)] border-0 rounded-2xl overflow-hidden bg-[#111216]">
        <div className="text-white p-6 bg-gradient-to-br from-[#CAAB5B] to-[#9A8245]">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Real Estate Tokenization Portal</h1>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-sm text-emerald-500">Verified Seller</span>
            </div>
          </div>
        </div>
        <CardContent className="p-8">
          <div className="relative mb-8">
            <div className="w-full h-2 rounded-full bg-[#2C2C2C]">
              <div
                className="h-2 rounded-full transition-all duration-500 bg-gradient-to-r from-[#CAAB5B] to-emerald-500"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-center mt-2 text-[#6D6041]">
              Step {step} of {totalSteps}
            </p>
          </div>

          {uploadStatus && (
            <div className={`mb-4 p-4 rounded-2xl border ${
              uploadStatus.includes("Error") 
                ? "bg-red-500/10 border-red-500 text-red-500" 
                : uploadStatus.includes("successful")
                ? "bg-emerald-500/10 border-emerald-500 text-emerald-500"
                : "bg-[#CAAB5B]/10 border-[#CAAB5B] text-[#CAAB5B]"
            }`}>
              {uploadStatus}
              {metadataUri && (
                <div className="mt-2 text-sm">
                  <a href={metadataUri} target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">
                    View on IPFS →
                  </a>
                </div>
              )}
            </div>
          )}

          <div>
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  variants={stepVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="grid gap-4"
                >
                  <h2 className="text-xl font-semibold mb-2 text-[#E1E2E2]">🏠 Property Details</h2>
                  
                  <div>
                    <Input 
                      placeholder="Property Title" 
                      {...register("propertyTitle", {
                        required: "Property title is required",
                        minLength: {
                          value: 3,
                          message: "Title must be at least 3 characters"
                        }
                      })} 
                      className="border rounded-2xl bg-[#121317] border-[#2C2C2C] text-[#E1E2E2] placeholder:text-[#6D6041]"
                    />
                    {errors.propertyTitle && (
                      <span className="text-red-500 text-sm mt-1 block">
                        {errors.propertyTitle.message}
                      </span>
                    )}
                  </div>

                  <div>
                    <Input 
                      placeholder="Property Type (e.g., Residential, Commercial)" 
                      {...register("propertyType", {
                        required: "Property type is required"
                      })} 
                      className="border rounded-2xl bg-[#121317] border-[#2C2C2C] text-[#E1E2E2] placeholder:text-[#6D6041]"
                    />
                    {errors.propertyType && (
                      <span className="text-red-500 text-sm mt-1 block">
                        {errors.propertyType.message}
                      </span>
                    )}
                  </div>

                  <div>
                    <Input 
                      placeholder="City, State" 
                      {...register("cityState", {
                        required: "Location is required"
                      })} 
                      className="border rounded-2xl bg-[#121317] border-[#2C2C2C] text-[#E1E2E2] placeholder:text-[#6D6041]"
                    />
                    {errors.cityState && (
                      <span className="text-red-500 text-sm mt-1 block">
                        {errors.cityState.message}
                      </span>
                    )}
                  </div>

                  <div>
                    <Textarea 
                      placeholder="Property Description" 
                      {...register("description", {
                        required: "Description is required",
                        minLength: {
                          value: 20,
                          message: "Description must be at least 20 characters"
                        }
                      })} 
                      className="border rounded-2xl bg-[#121317] border-[#2C2C2C] text-[#E1E2E2] placeholder:text-[#6D6041]"
                    />
                    {errors.description && (
                      <span className="text-red-500 text-sm mt-1 block">
                        {errors.description.message}
                      </span>
                    )}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  variants={stepVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="grid gap-4"
                >
                  <h2 className="text-xl font-semibold mb-2 text-[#E1E2E2]">👤 Owner Information</h2>
                  
                  <div>
                    <Input 
                      placeholder="Full Name" 
                      {...register("fullName", {
                        required: "Full name is required",
                        minLength: {
                          value: 4,
                          message: "Name must be at least 4 characters"
                        }
                      })} 
                      className="border rounded-2xl bg-[#121317] border-[#2C2C2C] text-[#E1E2E2] placeholder:text-[#6D6041]"
                    />
                    {errors.fullName && (
                      <span className="text-red-500 text-sm mt-1 block">
                        {errors.fullName.message}
                      </span>
                    )}
                  </div>

                  <div>
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
                      className="border rounded-2xl bg-[#121317] border-[#2C2C2C] text-[#E1E2E2] placeholder:text-[#6D6041]"
                    />
                    {errors.email && (
                      <span className="text-red-500 text-sm mt-1 block">
                        {errors.email.message}
                      </span>
                    )}
                  </div>

                  <div>
                    <Input 
                      placeholder="Phone Number" 
                      {...register("phone", {
                        required: "Phone number is required",
                        pattern: {
                          value: /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
                          message: "Invalid phone number"
                        }
                      })} 
                      className="border rounded-2xl bg-[#121317] border-[#2C2C2C] text-[#E1E2E2] placeholder:text-[#6D6041]"
                    />
                    {errors.phone && (
                      <span className="text-red-500 text-sm mt-1 block">
                        {errors.phone.message}
                      </span>
                    )}
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  variants={stepVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="grid gap-4"
                >
                  <h2 className="text-xl font-semibold mb-2 text-[#E1E2E2]">💰 Financial Details</h2>
                  
                  <div>
                    <Input 
                      type="number" 
                      placeholder="Purchase Price" 
                      {...register("purchasePrice", {
                        required: "Purchase price is required",
                        min: {
                          value: 1,
                          message: "Price must be greater than 0"
                        }
                      })} 
                      className="border rounded-2xl bg-[#121317] border-[#2C2C2C] text-[#E1E2E2] placeholder:text-[#6D6041]"
                    />
                    {errors.purchasePrice && (
                      <span className="text-red-500 text-sm mt-1 block">
                        {errors.purchasePrice.message}
                      </span>
                    )}
                  </div>

                  <div>
                    <Input 
                      type="number" 
                      placeholder="Tokenization Value" 
                      {...register("tokenizationValue", {
                        required: "Tokenization value is required",
                        min: {
                          value: 1,
                          message: "Value must be greater than 0"
                        }
                      })} 
                      className="border rounded-2xl bg-[#121317] border-[#2C2C2C] text-[#E1E2E2] placeholder:text-[#6D6041]"
                    />
                    {errors.tokenizationValue && (
                      <span className="text-red-500 text-sm mt-1 block">
                        {errors.tokenizationValue.message}
                      </span>
                    )}
                  </div>

                  <div>
                    <Input 
                      type="number" 
                      placeholder="Monthly Revenue" 
                      {...register("monthlyRevenue", {
                        required: "Monthly revenue is required",
                        min: {
                          value: 0,
                          message: "Revenue cannot be negative"
                        }
                      })} 
                      className="border rounded-2xl bg-[#121317] border-[#2C2C2C] text-[#E1E2E2] placeholder:text-[#6D6041]"
                    />
                    {errors.monthlyRevenue && (
                      <span className="text-red-500 text-sm mt-1 block">
                        {errors.monthlyRevenue.message}
                      </span>
                    )}
                  </div>

                  <div>
                    <Input 
                      type="number" 
                      placeholder="Monthly Expenses" 
                      {...register("monthlyExpenses", {
                        required: "Monthly expenses is required",
                        min: {
                          value: 0,
                          message: "Expenses cannot be negative"
                        }
                      })} 
                      className="border rounded-2xl bg-[#121317] border-[#2C2C2C] text-[#E1E2E2] placeholder:text-[#6D6041]"
                    />
                    {errors.monthlyExpenses && (
                      <span className="text-red-500 text-sm mt-1 block">
                        {errors.monthlyExpenses.message}
                      </span>
                    )}
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step4"
                  variants={stepVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  <h2 className="text-2xl font-semibold text-[#E1E2E2]">📸 Media Uploads</h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <Controller
                      control={control}
                      name="images"
                      defaultValue={[]}
                      render={({ field: { onChange, value = [] } }) => {
                        const { getRootProps, getInputProps } = useDropzone({
                          accept: { "image/*": [] },
                          multiple: true,
                          onDrop: (files) => onChange([...value, ...files].slice(0, 5)),
                        });

                        return (
                          <motion.div
                            {...getRootProps()}
                            className="border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all border-[#2C2C2C] bg-[#121317] hover:border-[#CAAB5B] hover:bg-[#CAAB5B]/5"
                            whileHover={{ scale: 1.02 }}
                          >
                            <input {...getInputProps()} />
                            <p className="text-[#6D6041]">
                              Drag or click to upload <b className="text-[#CAAB5B]">images</b> (max 5)
                            </p>

                            {value.length > 0 && (
                              <div className="flex flex-wrap gap-3 mt-4 justify-center">
                                {value.map((file, i) => (
                                  <motion.img
                                    key={i}
                                    src={URL.createObjectURL(file)}
                                    alt="upload preview"
                                    className="w-24 h-24 object-cover rounded-lg shadow-[0_4px_15px_rgba(0,0,0,0.3)] border-2 border-[#2C2C2C]"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                  />
                                ))}
                              </div>
                            )}
                          </motion.div>
                        );
                      }}
                    />

                    <Controller
                      control={control}
                      name="documents"
                      defaultValue={[]}
                      render={({ field: { onChange, value = [] } }) => {
                        const { getRootProps, getInputProps } = useDropzone({
                          accept: { "application/pdf": [] },
                          multiple: true,
                          onDrop: (files) => onChange([...value, ...files].slice(0, 5)),
                        });

                        return (
                          <motion.div
                            {...getRootProps()}
                            className="border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all border-[#2C2C2C] bg-[#121317] hover:border-[#CAAB5B] hover:bg-[#CAAB5B]/5"
                            whileHover={{ scale: 1.02 }}
                          >
                            <input {...getInputProps()} />
                            <p className="text-[#6D6041]">
                              Upload <b className="text-[#CAAB5B]">documents</b> (PDF only, max 5)
                            </p>

                            {value.length > 0 && (
                              <ul className="mt-4 text-sm text-left space-y-2 text-[#E1E2E2]">
                                {value.map((file, i) => (
                                  <motion.li
                                    key={i}
                                    className="flex items-center gap-2"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                  >
                                    📄 {file.name}
                                  </motion.li>
                                ))}
                              </ul>
                            )}
                          </motion.div>
                        );
                      }}
                    />
                  </div>
                </motion.div>
              )}

              {step === 5 && (
                <motion.div
                  key="step5"
                  variants={stepVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <h2 className="text-xl font-semibold mb-4 text-[#E1E2E2]">⚖️ Legal & Compliance</h2>
                  
                  <div>
                    <div className="flex items-center gap-3 p-4 rounded-2xl border bg-[#121317] border-[#2C2C2C]">
                      <Checkbox 
                        {...register("acceptTerms", {
                          required: "You must accept terms & conditions"
                        })} 
                      /> 
                      <span className="text-[#E1E2E2]">I accept terms & conditions</span>
                    </div>
                    {errors.acceptTerms && (
                      <span className="text-red-500 text-sm mt-1 block">
                        {errors.acceptTerms.message}
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-3 p-4 rounded-2xl border bg-[#121317] border-[#2C2C2C]">
                      <Checkbox 
                        {...register("confirmOwnership", {
                          required: "You must confirm property ownership"
                        })} 
                      /> 
                      <span className="text-[#E1E2E2]">I confirm property ownership</span>
                    </div>
                    {errors.confirmOwnership && (
                      <span className="text-red-500 text-sm mt-1 block">
                        {errors.confirmOwnership.message}
                      </span>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-8 pt-4 flex justify-between items-center border-t border-[#2C2C2C]">
              {step > 1 && (
                <Button
                  type="button"
                  onClick={prevStep}
                  disabled={uploading}
                  className="border rounded-2xl px-6 py-2 transition-all hover:opacity-80 bg-transparent border-[#2C2C2C] text-[#E1E2E2]"
                >
                  ← Back
                </Button>
              )}

              {step < totalSteps && (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="ml-auto px-6 py-2 rounded-2xl font-semibold text-black transition-all hover:opacity-90 bg-[#CAAB5B]"
                >
                  Next →
                </Button>
              )}

              {step === totalSteps && (
                <Button
                  type="button"
                  onClick={handleSubmit(onSubmit)}
                  disabled={uploading}
                  className="ml-auto px-6 py-2 rounded-2xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 bg-emerald-500"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Submit"
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}