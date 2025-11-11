"use client";

import React from "react";
import Image from "next/image";
import AlertDialogBox from "../dialogueBox/AlertDialogueBox";
interface BulkActionProps {
  number?: string;
  rounded?: boolean;
  modalProps: {
    open: boolean;
    setOpen: (value: boolean) => void;
  };
  rows: React.ReactNode[];
  deselectRows: () => void;
  onDelete: () => void;
  pageName?: string;
}

function BulkAction({
  modalProps: { open },
  rows,
  deselectRows,
  onDelete,
  pageName
}: BulkActionProps) {
  return (
    <div
      className={`fixed z-50 bg-black text-white mx-auto w-[800px] rounded-lg px-md py-sm left-1/2 -translate-x-1/2 bottom-18 flex justify-between items-center shadow-lg ${
        open ? "" : "hidden"
      }  `}
    >
      <div>
        <button
          className="bg-none ring-1 ring-white px-md py-sm rounded-lg text-xs flex items-center space-x-2"
          onClick={deselectRows}
        >
          <span>{`${rows.length} Selected`}</span>
          <Image
            src={"/assets/icons/x-white.svg"}
            height={16}
            width={16}
            alt="close-icon"
          />
        </button>
      </div>
      <div className="w-fit h-fit rounded-lg px-3 py-1 gap-2 flex flex-row">
        <AlertDialogBox
          title={"Delete Record(s)?"}
          description={
            `This action will delete the ${pageName || 'record(s)'}. This action can not be undone.`
          }
          cancelButtonText={"Cancel"}
          confirmButtonText={"Delete"}
          onConfirm={onDelete}
          trigger={
            <div
              className="flex items-center space-x-2 cursor-pointer"
            >
              <Image
                src={"/assets/icons/trash.svg"}
                height={16}
                width={16}
                alt="trash-icon"
              />
              <span className="text-text-destructive">Delete</span>
            </div>
          }
        ></AlertDialogBox>
      </div>
    </div>
  );
}

export default BulkAction;
