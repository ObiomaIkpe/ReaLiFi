import { useFormContext, Controller } from "react-hook-form";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";

export default function UploadStep() {
  const { control } = useFormContext();

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="text-2xl font-semibold text-center sm:text-left">
        📸 Upload Files
      </h2>

      {/* Grid layout for both upload sections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* ---------------- Property Images ---------------- */}
        <Controller
          name="propertyImages"
          control={control}
          defaultValue={[]} // ✅ ensures array is initialized
          render={({ field }) => {
            const { onChange, value = [] } = field;

            const { getRootProps, getInputProps } = useDropzone({
              accept: { "image/*": [] },
              multiple: true,
              onDrop: (files) => {
                const newFiles = [...value, ...files].slice(0, 5);
                onChange(newFiles);
              },
            });

            return (
              <motion.div
                {...getRootProps()}
                className="border-2 border-dashed rounded-2xl p-6 bg-gray-50 text-center cursor-pointer hover:bg-gray-100 transition-colors"
                whileHover={{ scale: 1.02 }}
              >
                <input {...getInputProps()} />
                <p className="text-gray-600 mb-2">
                  Drag & drop or click to upload images (max 5)
                </p>

                {value.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-3 mt-4">
                    {value.map((file, i) => (
                      <motion.img
                        key={i}
                        src={URL.createObjectURL(file)}
                        alt="Property"
                        className="w-24 h-24 object-cover rounded-lg shadow-sm border"
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

        {/* ---------------- Documents Upload ---------------- */}
        <Controller
          name="documents"
          control={control}
          defaultValue={[]} // ✅ ensures array is initialized
          render={({ field }) => {
            const { onChange, value = [] } = field;

            const { getRootProps, getInputProps } = useDropzone({
              accept: { "application/pdf": [] },
              multiple: true,
              onDrop: (files) => {
                const newFiles = [...value, ...files].slice(0, 5);
                onChange(newFiles);
              },
            });

            return (
              <motion.div
                {...getRootProps()}
                className="border-2 border-dashed rounded-2xl p-6 bg-gray-50 text-center cursor-pointer hover:bg-gray-100 transition-colors"
                whileHover={{ scale: 1.02 }}
              >
                <input {...getInputProps()} />
                <p className="text-gray-600 mb-2">
                  Upload legal/property documents (PDF only, max 5)
                </p>

                {value.length > 0 && (
                  <ul className="mt-3 text-sm text-gray-700 space-y-2 text-left">
                    {value.map((file, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2"
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
  );
}
