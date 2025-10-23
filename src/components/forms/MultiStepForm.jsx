import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useDropzone } from "react-dropzone";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
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
  } = useForm({
    defaultValues: { images: [], documents: [] },
  });

  // Check if user is registered as seller
  const { data: isSeller, isLoading: checkingStatus, refetch } = useReadContract({
    address: REAL_ESTATE_DAPP_ADDRESS,
    abi: REAL_ESTATE_DAPP,
    functionName: 'sellers',
    args: [address],
    enabled: !!address,
  });

  const nextStep = () => setStep((s) => Math.min(s + 1, totalSteps));
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
      <div className="flex justify-center items-center min-h-screen bg-gray-50 px-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Wallet Not Connected</h2>
            <p className="text-gray-600 mb-6">
              Please connect your wallet to access the property tokenization portal.
            </p>
            <p className="text-sm text-gray-500">
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
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Checking seller status...</p>
        </div>
      </div>
    );
  }

  // Show seller registration if not registered
  if (!isSeller) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 px-4">
        <Card className="w-full max-w-2xl shadow-xl">
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-6 rounded-t-2xl">
            <h1 className="text-2xl font-bold">Seller Registration Required</h1>
          </div>
          <CardContent className="p-8">
            <div className="text-center">
              <AlertCircle className="w-20 h-20 text-yellow-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-4">Register as a Seller</h2>
              <p className="text-gray-600 mb-6 text-lg">
                You need to register as a seller before you can create and list real estate assets on our platform.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 text-left">
                <h3 className="font-semibold text-blue-900 mb-3">What you'll get:</h3>
                <ul className="space-y-2 text-blue-800">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span>Ability to tokenize and list your real estate properties</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span>Access to a global marketplace of investors</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span>Secure blockchain-verified transactions</span>
                  </li>
                </ul>
              </div>

              <Button
                onClick={handleRegisterSeller}
                disabled={isRegisterPending || isRegisterConfirming}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
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
                <p className="text-sm text-gray-500 mt-4">
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
    <div className="flex justify-center items-center min-h-screen bg-gray-50 px-4 py-10">
      <Card className="w-full max-w-3xl shadow-xl border-gray-200 rounded-2xl">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Real Estate Tokenization Portal</h1>
            <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm">Verified Seller</span>
            </div>
          </div>
        </div>
        <CardContent className="p-8">
          <div className="relative mb-8">
            <div className="w-full bg-gray-200 h-2 rounded-full">
              <div
                className="h-2 bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 text-center mt-2">
              Step {step} of {totalSteps}
            </p>
          </div>

          {uploadStatus && (
            <div className={`mb-4 p-4 rounded-lg ${
              uploadStatus.includes("Error") 
                ? "bg-red-100 text-red-700" 
                : uploadStatus.includes("successful")
                ? "bg-green-100 text-green-700"
                : "bg-blue-100 text-blue-700"
            }`}>
              {uploadStatus}
              {metadataUri && (
                <div className="mt-2 text-sm">
                  <a href={metadataUri} target="_blank" rel="noopener noreferrer" className="underline">
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
                  <h2 className="text-xl font-semibold">🏠 Property Details</h2>
                  <Input placeholder="Property Title" {...register("propertyTitle")} />
                  <Input placeholder="Property Type" {...register("propertyType")} />
                  <Input placeholder="City, State" {...register("cityState")} />
                  <Textarea placeholder="Description" {...register("description")} />
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
                  <h2 className="text-xl font-semibold">👤 Owner Information</h2>
                  <Input placeholder="Full Name" {...register("fullName")} />
                  <Input placeholder="Email Address" type="email" {...register("email")} />
                  <Input placeholder="Phone Number" {...register("phone")} />
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
                  <h2 className="text-xl font-semibold">💰 Financial Details</h2>
                  <Input type="number" placeholder="Purchase Price" {...register("purchasePrice")} />
                  <Input type="number" placeholder="Tokenization Value" {...register("tokenizationValue")} />
                  <Input type="number" placeholder="Monthly Revenue" {...register("monthlyRevenue")} />
                  <Input type="number" placeholder="Monthly Expenses" {...register("monthlyExpenses")} />
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
                  <h2 className="text-2xl font-semibold">📸 Media Uploads</h2>

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
                            className="border-2 border-dashed rounded-2xl p-6 text-center bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                            whileHover={{ scale: 1.02 }}
                          >
                            <input {...getInputProps()} />
                            <p className="text-gray-600">
                              Drag or click to upload <b>images</b> (max 5)
                            </p>

                            {value.length > 0 && (
                              <div className="flex flex-wrap gap-3 mt-4 justify-center">
                                {value.map((file, i) => (
                                  <motion.img
                                    key={i}
                                    src={URL.createObjectURL(file)}
                                    alt="upload preview"
                                    className="w-24 h-24 object-cover rounded-lg border shadow-sm"
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
                            className="border-2 border-dashed rounded-2xl p-6 text-center bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                            whileHover={{ scale: 1.02 }}
                          >
                            <input {...getInputProps()} />
                            <p className="text-gray-600">
                              Upload <b>documents</b> (PDF only, max 5)
                            </p>

                            {value.length > 0 && (
                              <ul className="mt-4 text-sm text-gray-700 text-left space-y-2">
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
                  <h2 className="text-xl font-semibold">⚖️ Legal & Compliance</h2>
                  <div className="flex items-center gap-2">
                    <Checkbox {...register("acceptTerms")} /> <span>I accept terms & conditions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox {...register("confirmOwnership")} /> <span>I confirm property ownership</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-8 pt-4 border-t flex justify-between items-center">
              {step > 1 && (
                <Button
                  type="button"
                  onClick={prevStep}
                  variant="outline"
                  disabled={uploading}
                >
                  ← Back
                </Button>
              )}

              {step < totalSteps && (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="ml-auto bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Next →
                </Button>
              )}

              {step === totalSteps && (
                <Button
                  type="button"
                  onClick={handleSubmit(onSubmit)}
                  disabled={uploading}
                  className="ml-auto bg-green-600 hover:bg-green-700 text-white"
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