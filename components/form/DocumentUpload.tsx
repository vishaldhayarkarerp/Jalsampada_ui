"use client";
import { useState, useCallback } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { Upload, X } from "lucide-react";
import Image from "next/image";

type UploadStatus = "success" | "error" | null;

type DocumentUploadProps = {
  onUpload?: (file: File) => void;
};

export default function DocumentUpload({ onUpload }: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (fileRejections.length > 0) {
        setUploadStatus("error");
        setFile(fileRejections[0].file);
      } else {
        const uploadedFile = acceptedFiles[0];
        setUploadStatus("success");
        setFile(uploadedFile);
        if (onUpload) {
          onUpload(uploadedFile);
        }
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-dashed border-2 rounded-lg p-4 text-center cursor-pointer hover:border-primary ${
          isDragActive ? "border-primary" : "border-gray-300"
        }`}
      >
        {uploadStatus === "success" && (
          <div className="flex items-center justify-between mb-5 p-3 text-sm bg-green-50 text-green-700 rounded w-full">
            <div className="flex">
              <Image
                src={"/assets/icons/InfoCircleSuccess.svg"}
                alt="Success Icon"
                className="mr-2"
                width={16}
                height={16}
              />
              <span>Upload complete.</span>
            </div>
            <X width={16} height={16} className="text-neutral-500" />
          </div>
        )}

        {uploadStatus === "error" && (
          <div className="flex items-center justify-between mb-4 p-3 text-sm bg-pink-50 text-danger rounded w-full">
            <div className="flex">
              <Image
                src={"/assets/icons/InfoCircleDanger.svg"}
                alt="Error Icon"
                className="mr-2"
                width={16}
                height={16}
              />
              <span>
                Upload failed. Please check file format and try again.
              </span>
            </div>
            <X width={16} height={16} className="text-neutral-500" />
          </div>
        )}

        <Upload color="#60646C" className="m-auto mb-4" />
        <input {...getInputProps()} />
        <p className="text-[#1C2024]">
          Drag & Drop or <span className="text-primary">Choose File</span> to
          Upload
        </p>
        <p className="text-xs text-gray-500 mt-2">
          xls only
          <br />
          <br />
          Maximum file size 10 MB
        </p>

        {file && (
          <div className="mt-4 text-left border rounded-lg border-border p-3">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-700 font-medium">
                {file.name}
              </div>
              <div className="text-xs text-gray-700 font-medium">100%</div>
            </div>
            <div className="w-full bg-gray-200 rounded h-2 mt-2">
              <div
                className={`h-2 rounded ${
                  uploadStatus === "success" ? "bg-green-500" : "bg-red-500"
                }`}
                style={{ width: "100%" }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {(file.size / 1024).toFixed(0)}KB
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
