"use client";
import { useEffect, useRef, useState } from "react";
import { flexRender } from "@tanstack/react-table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import Add from "@/assets/icons/PlusBlue.svg";
import Buttons from "@/components/buttons/Button";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TooltipArrow } from "@radix-ui/react-tooltip";
import BulkAction from "../bulkAction/BulkAction";

const authorizedBy = [
  { value: "Dr. Sangram Chougale", label: "Dr. Sangram Chougale" },
  { value: "Dr. Ashish Shinde", label: "Dr. Ashish Shinde" },
  { value: "Dr. Sahil Chougale", label: "Dr. Sahil Chougale" },
  { value: "Dr. Vaibhav Gavas", label: "Dr. Vaibhav Gavas" },
];

export function DataTable({
  columns,
  initialData,
  addButton,
  table,
  dataProps,
  size = "small",
}) {
  const [showAddButton, setShowAddButton] = useState(true);
  const [showCommand, setShowCommand] = useState(false);
  const [showList, setShowList] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [value, setValue] = useState("");
  // const [tempSelectedService, setTempSelectedService] = useState<string>("");
  const [showRowActions, setShowRowActions] = useState(false);
  const [showInputRow, setShowInputRow] = useState(false);
  const [initialInput, setInitialInput] = useState("");
  const [error, setError] = useState(null);
  const patientInputRef = useRef(null);
  const cellRefs = useRef([]);

  const data = dataProps?.data;
  const setData = dataProps?.setData;

  const selectedRows = table.getSelectedRowModel().rows.map((row) => ({
    id: row.original.id,
    ...row.original,
  }));

  useEffect(() => {
    setShowRowActions(selectedRows.length !== 0);
  }, [selectedRows]);

  const deselectRows = () => {
    setShowRowActions(false);
    table.toggleAllPageRowsSelected(false);
  };

  const handleDelete = () => {
    if (!setData) return;
    const selectedIds = selectedRows.map((row) => row.id);
    setData((prev) => prev.filter((item) => !selectedIds.includes(item.id)));
    deselectRows();
  };

  const openCommand = (rowIndex) => {
    setSelectedRow(rowIndex);
    setShowCommand(true);
  };

  const openList = (rowIndex) => {
    setSelectedRow(rowIndex);
    setShowList(true);
  };

  const selectCommandValue = (value) => {
    if (!setData) return;
    setData((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        service: value,
        amount: "",
        status: "Pending",
      },
    ]);
    setShowCommand(false);
    setShowAddButton(true);
  };

  const selectListValue = (value) => {
    if (!setData) return;
    setData((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        authorizedBy: value,
        amount: "",
        concession: 10,
        totalamt: 1000,
      },
    ]);
    setShowList(false);
    setShowAddButton(true);
  };

  const handleUpdate = (id, field, value) => {
    if (!setData) return;
    setData((prevData) =>
      prevData.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const showNew = (isCommand) => {
    setShowAddButton(false);
    setShowCommand(isCommand);
    setShowInputRow(!isCommand);
  };

  const showNewList = (isList) => {
    setShowList(isList);
    setShowInputRow(!isList);
  };
  useEffect(() => {
    if (showInputRow && columns[0]?.id === "service") {
      setShowCommand(true);
    }
    if (showInputRow && columns[0]?.id === "authorizedBy") {
      setShowList(true);
    }
  }, [showInputRow, columns]);

  useEffect(() => {
    if (showInputRow && patientInputRef.current) {
      patientInputRef.current.focus();
    }
  }, [showInputRow]);

  const formatDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString("en-US", { month: "short" });
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };
  

  const addRow = (values) => {
    console.log(values);
    if (!setData) return;
    setShowInputRow(false);
    const key = columns[0]?.accessorKey;
    const inputValue = Object.values(values)[0];

    // const newRow = {
    //   [key]: inputValue,
    // };
    setData((prev) => [...prev, {
      id: prev.length + 1,
      [key]: inputValue,
      paymentDate: formatDate(new Date()),
    }]);
    setShowAddButton(true);
  };

  const removeRow = () => {
    setShowInputRow(false);
    setShowAddButton(true);
  };

  useEffect(() => {
    if (!data) return;
    focusNextCell(data.length - 1, 0);
  }, [data?.length]);

  const focusNextCell = (rowIndex, columnIndex) => {
    const nextCell =
      cellRefs.current[rowIndex]?.[columnIndex + 1] ||
      cellRefs.current[rowIndex + 1]?.[0];

    if (nextCell) nextCell.click();
  };


  return (
    <div className="relative w-full border border-[#CDCED6] rounded-t-lg overflow-x-auto bg-white rounded-lg">
      <div className="relative flex flex-col">
        <UITable
          className={`w-full border-separate rounded-lg border-spacing-0 text-xs whitespace-nowrap 
          ${!showInputRow ? "rounded-none" : "rounded-b-lg"}`}
        >
          <TableHeader className="sticky top-0 z-40 bg-white">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={`min-h-0 px-3 py-0 bg-[#F9F9FB] hover:bg-[#F9F9FB] border border-x-0 border-t-0 border-b-[#CDCED6] text-[#60646C] hover:text-[#1C2024] font-semibold cursor-pointer
                    ${
                      ["service", "services", "Service"].includes(
                        header.column.id
                      )
                        ? "sticky left-0 z-50 bg-[#F9F9FB]"
                        : ""
                    }
                    ${
                      header.column.id === "totalamt"
                        ? "sticky right-0 z-50 bg-[#F9F9FB]"
                        : ""
                    }`}
                  >
                    <div className="flex items-center">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="overflow-auto max-h-[calc(50vh)]">
            {table.getRowModel().rows.length === 0 ? (
              <TableRow className="h-10 text-[#1C2024] bg-white group hover:bg-[#E6F4FE] hover:text-[#0D74CE]">
                {table.getAllColumns().map((_, index) => (
                  <TableCell key={index} className="px-3" />
                ))}
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row, rowIndex) => (
                <TableRow
                  key={row.id}
                  className="h-10 text-[#1C2024] bg-white group hover:bg-[#E6F4FE] hover:text-[#0D74CE] border-b border-[#CDCED6]"
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell, columnIndex) => (
                    <EditableCell
                      id={`cell-${rowIndex}-${columnIndex}`}
                      key={cell.id}
                      cell={cell}
                      onUpdate={handleUpdate}
                      focusNextCell={focusNextCell}
                      rowIndex={rowIndex}
                      columnIndex={columnIndex}
                      type={
                        cell.column.id === "authorizedBy"
                          ? "list"
                          : cell.column.id === "service"
                          ? "command"
                          : "text"
                      }
                      openCommand={openCommand}
                      openList={openList}
                      columns={columns}
                      addButton={addButton}
                      initialData={initialData}
                      size={size}
                      ref={(el) => {
                        if (!cellRefs.current[rowIndex]) {
                          cellRefs.current[rowIndex] = [];
                        }
                        cellRefs.current[rowIndex][columnIndex] = el;
                      }}
                    />
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </UITable>
        <div className="flex justify-center items-center">
          <BulkAction
            modalProps={{
              open: showRowActions,
              setOpen: deselectRows,
            }}
            deselectRows={deselectRows}
            rows={selectedRows}
            onDelete={handleDelete}
          />
        </div>
      </div>

      <div className="sticky bottom-0 left-0 right-0 z-20">
        {showInputRow && (
          <div className="bg-white">
            <div className="flex items-center w-full gap-2 pr-2 h-10">
              <TooltipProvider>
                <Tooltip open={!!error}>
                  <TooltipTrigger asChild>
                    <Input
                      placeholder="Type here..."
                      value={initialInput}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Check if the first column is numeric
                        const isNumericColumn =
                          columns[0]?.id === "amount" ||
                          columns[0]?.id === "rate" ||
                          columns[0]?.id === "quantity" ||
                          columns[0]?.accessorKey === "paidAmount" ||
                          columns[0]?.id === "totalamt" ||
                          columns[0]?.id === "Rate";
                        setInitialInput(value);
                        if (isNumericColumn) {
                          setError(
                            /^\d+(\.\d{1,2})?$/.test(value)
                              ? null
                              : "Enter a valid number"
                          );
                        } else {
                          // For text fields, just check if it's not empty
                          setError(
                            value.trim() ? null : "Field cannot be empty"
                          );
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const isNumericColumn =
                            columns[0]?.id === "amount" ||
                            columns[0]?.id === "rate" ||
                            columns[0]?.id === "quantity" ||
                            columns[0]?.accessorKey === "paidAmount" ||
                            columns[0]?.id === "totalamt" ||
                            columns[0]?.id === "Rate";

                          if (isNumericColumn) {
                            if (
                              initialInput.trim() &&
                              /^\d+(\.\d{1,2})?$/.test(initialInput)
                            ) {
                              addRow({
                                [columns[0]?.id]: initialInput,
                              });
                              setShowInputRow(false);
                              setShowAddButton(true);
                              setInitialInput("");
                              setError(null);
                            }
                          } else {
                            if (initialInput.trim()) {
                              addRow({
                                [columns[0]?.id]: initialInput,
                              });
                              setShowInputRow(false);
                              setShowAddButton(true);
                              setInitialInput("");
                              setError(null);
                            }
                          }
                        } else if (e.key === "Escape") {
                          e.preventDefault();
                          removeRow();
                          setError(null);
                        }
                      }}
                      ref={patientInputRef}
                      className={`flex-1 border-none shadow-none focus-visible:ring-0 ${
                        error ? "bg-red-100 border border-red-500" : ""
                      }`}
                    />
                  </TooltipTrigger>
                  <TooltipContent className="bg-[#DC3E42] text-white text-sm font-medium flex flex-row gap-1 item">
                    <Image
                      src={"/assets/icons/InfoCircleWhite.svg"}
                      alt="Circle"
                      width={16}
                      height={16}
                      className="rounded-lg"
                    />
                    {error}
                    <TooltipArrow className="fill-[#DC3E42]" />
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="flex items-center gap-2 shrink-0">
                <Buttons
                  size="button-xsmall"
                  type="secondary-button"
                  variant="button"
                  onClick={() => {
                    const isNumericColumn =
                      columns[0]?.id === "amount" ||
                      columns[0]?.id === "rate" ||
                      columns[0]?.id === "quantity" ||
                      columns[0]?.accessorKey === "paidAmount" ||
                      columns[0]?.id === "totalamt" ||
                      columns[0]?.id === "Rate";

                    if (isNumericColumn) {
                      if (
                        initialInput.trim() &&
                        /^\d+(\.\d{1,2})?$/.test(initialInput)
                      ) {
                        addRow({
                          [columns[0]?.id]: initialInput,
                        });
                        setShowInputRow(false);
                        setShowAddButton(true);
                        setInitialInput("");
                      }
                    } else {
                      if (initialInput.trim()) {
                        addRow({
                          [columns[0]?.id]: initialInput,
                        });
                        setShowInputRow(false);
                        setShowAddButton(true);
                        setInitialInput("");
                      }
                    }
                  }}
                  disabled={
                    !initialInput.trim() ||
                    (columns[0]?.id === "amount" &&
                      !/^\d*\.?\d*$/.test(initialInput))
                  }
                >
                  Save
                </Buttons>
                <button
                  className="w-fit h-[24px] font-medium text-xs leading-4 pl-3 pr-3 pt-1 pb-1 rounded-[4px]
                    bg-white border-[1px] border-[#D9D9E0] hover:bg-[#E8E8EC] hover:border-[#B9BBC6] active:bg-[#E8E8EC]
                    focus-visible:ring-[#0090FF] disabled:border-[#B9BBC6] disabled:text-[#000000] disabled:bg-white
                    flex flex-row gap-2 justify-center items-center text-[#CE2C31]
                    focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none whitespace-nowrap"
                  onClick={() => removeRow()}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
        {addButton && showAddButton && (
          <div className="bg-white ">
            <div className="flex items-center w-full gap-2 pr-2 h-10">
              <div
                className="flex items-center gap-1 cursor-pointer px-3"
                onClick={() => {
                  const isCommand = columns.some(
                    (col) => col.isCommand === true
                  );
                  showNew(isCommand);
                  const isList = columns.some((col) => col.isList === true);
                  showNewList(isList);
                  if (isList || isCommand) {
                    setShowInputRow(false);
                  }
                }}
              >
                <Image
                  src={"/assets/icons/PlusBlue.svg"}
                  width={20}
                  height={20}
                  alt="add"
                />
                <Button
                  size="link-size"
                  type="link-primary"
                  variant="link-button"
                  className="text-xs font-semibold text-[#0D74CE]"
                >
                  Add New
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      {showCommand && (
        <Popover
          open={showCommand}
          onOpenChange={(open) => {
            setShowCommand(open);
            if (!open) setShowAddButton(true); // Ensure "Add New" shows when command closes
          }}
        >
          <PopoverTrigger asChild>
            <div className="w-full" onClick={() => setShowCommand(true)}></div>
          </PopoverTrigger>
          <PopoverContent
            sideoff="bottom"
            align="start"
            sideOffset={-15}
            className="w-[768px] p-0 shadow-none border-none -translate-x-[1px] "
          >
            <Command className="drop-shadow-none border border-[#CDCED6] border-t-0 rounded-t-none p-0">
              <CommandInput
                placeholder="Search services or packages..."
                className="w-full px-4 py-2"
              />
              <CommandList className="mb-3 p-0">
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup
                  heading={
                    <span className="text-[#60646C] text-xs font-medium px-4 py-2">
                      Services
                    </span>
                  }
                  className="p-0 rounded-none"
                >
                  <CommandItem
                    onSelect={() => {
                      selectCommandValue("General Consultation");
                      setShowCommand(false);
                    }}
                    className="hover:bg-[#E6F4FE] hover:text-[#0D74CE] data-[selected=true]:bg-[#E6F4FE] data-[selected=true]:text-[#0D74CE] !important"
                  >
                    <div className="flex flex-row justify-between w-full px-4 py-1">
                      <span>General Consultation</span>
                      <span>000012</span>
                    </div>
                  </CommandItem>
                  <CommandItem
                    onSelect={() => {
                      selectCommandValue("Sleep Test");
                      setShowCommand(false);
                    }}
                    className="hover:bg-[#E6F4FE] hover:text-[#0D74CE] data-[selected=true]:bg-[#E6F4FE] data-[selected=true]:text-[#0D74CE] !important"
                  >
                    <div className="flex flex-row justify-between w-full px-4 py-1">
                      <span> Sleep Test</span>
                      <span>000011</span>
                    </div>
                  </CommandItem>
                  <CommandItem
                    onSelect={() => {
                      selectCommandValue("Physiotherapy Session");
                      setShowCommand(false);
                    }}
                    className="hover:bg-[#E6F4FE] hover:text-[#0D74CE] data-[selected=true]:bg-[#E6F4FE] data-[selected=true]:text-[#0D74CE] !important"
                  >
                    <div className="flex flex-row justify-between w-full px-4 py-1">
                      <span>Physiotherapy Session</span>
                      <span>000015</span>
                    </div>
                  </CommandItem>
                </CommandGroup>
                <CommandGroup
                  heading={
                    <span className="text-[#60646C] text-xs font-medium px-4 py-2">
                      Packages
                    </span>
                  }
                  className="p-0 rounded-none"
                >
                  <CommandItem
                    onSelect={() => {
                      selectCommandValue("Full Body Checkup");
                      setShowCommand(false);
                    }}
                    className="hover:bg-[#E6F4FE] hover:text-[#0D74CE] data-[selected=true]:bg-[#E6F4FE] data-[selected=true]:text-[#0D74CE] !important"
                  >
                    <div className="flex flex-row justify-between w-full px-4 py-1">
                      <span> Full Body Checkup</span>
                      <span>000016</span>
                    </div>
                  </CommandItem>
                  <CommandItem
                    onSelect={() => {
                      selectCommandValue("Blood Test");
                      setShowCommand(false);
                    }}
                    className="hover:bg-[#E6F4FE] hover:text-[#0D74CE] data-[selected=true]:bg-[#E6F4FE] data-[selected=true]:text-[#0D74CE] !important"
                  >
                    <div className="flex flex-row justify-between w-full px-4 py-1">
                      <span> Blood Test</span>
                      <span>000017</span>
                    </div>
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
      {showList && (
        <Popover
          open={showList}
          onOpenChange={(open) => {
            setShowList(open);
            if (!open) setShowAddButton(true); // Ensure "Add New" shows when command closes
          }}
        >
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={showList}
              className="w-full rounded-t-none h-10 justify-between hover:bg-[#E6F4FE] hover:text-[#0D74CE] border-none"
              onClick={(e) => {
                e.stopPropagation();
                setShowList(!showList);
              }}
            >
              {value
                ? authorizedBy.find(
                    (authorizedBy) => authorizedBy.value === value
                  )?.label
                : "Select a Doctor"}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-full p-0 shadow-none border-[#D9D9E0]"
            sideOffset={-630}
            onInteractOutside={(e) => {
              e.preventDefault();
              setShowList(false);
            }}
          >
            <Command
              className={`${
                size === "small"
                  ? "w-[590px]"
                  : size === "large"
                  ? "w-[calc(100vw-962px)]"
                  : "w-[590px]"
              }  shadow-none rounded-b-none`}
            >
              <CommandInput 
                placeholder="Search Doctors..." 
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setShowList(false);
                  }
                }}
              />
              <CommandList className="max-h-[236px] overflow-y-auto">
                <CommandEmpty>No Doctor found.</CommandEmpty>
                <CommandGroup className="pt-2 pb-3 pl-0 pr-0">
                  {authorizedBy.map((authorizedBy) => (
                    <CommandItem
                      className="hover:bg-[#E6F4FE] hover:text-[#0D74CE] data-[selected=true]:bg-[#E6F4FE] data-[selected=true]:text-[#0D74CE] !important h-9 px-4 py-1"
                      key={authorizedBy.value}
                      value={authorizedBy.value}
                      onSelect={(currentValue) => {
                        selectListValue(currentValue);
                        setShowList(false);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      {authorizedBy.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

const EditableCell = ({
  cell,
  onUpdate,
  focusNextCell,
  rowIndex,
  columnIndex,
  ref,
  type,
  size,
  className,
}) => {
  const [value, setValue] = useState(cell.getValue?.() ?? "");
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const [showList, setShowList] = useState(false);


  const isValidNumber = (val) => {
    if (typeof val !== "string") return false;

    if (cell.column.id === "quantity") {
      return /^\d+$/.test(val) && parseInt(val) > 0;
    }

    if (cell.column.id === "concession") {
      const numValue = parseFloat(val.replace("%", ""));
      return /^(\d+(\.\d{1,2})?)?%?$/.test(val) && numValue <= 100;
    }

    if (cell.column.id === "concessionAmt" || cell.column.id === "paidAmount") {
      return /^₹?(\d+(\.\d{1,2})?)?$/.test(val);
    }

    return /^(\d+(\.\d{1,2})?)?$/.test(val);
  };

  useEffect(() => {
    // Only update value if we're not currently editing to prevent reset while typing
    if (!isEditing) {
      setValue(cell.getValue?.() ?? "");
    }
  }, [cell, isEditing]);

  const handleBlur = () => {
    const isNumericField = [
      "rate",
      "quantity",
      "patientAmount",
      "companyAmount",
      "totalamt",
      "concession",
      "concessionAmt",
      "paidAmount",
      "Rate",
      "Quantity",
      "Amount",
      "GST (18%)",
      "Concession",
      "Total Amount",
    ].includes(cell.column.id);

    if (isNumericField && !isValidNumber(value)) {
      setValue(cell.getValue() ?? "");
      setError(null);
    } else {
      setError(null);
      const initialValue = cell.getValue();
      if (value !== initialValue) {
        onUpdate(cell.row.original.id, cell.column.id, value);
      }
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      handleBlur();
      focusNextCell(rowIndex, columnIndex, e.shiftKey);
    }
  };

  const selectListValue = (newValue) => {
    if (value !== newValue) {
      setValue(newValue);
      onUpdate(cell.row.original.id, cell.column.id, newValue);
    }
    setShowList(false);
  };

  return (
    <TableCell
      ref={ref}
      onClick={(e) => {
        // Don't interfere with dropdown elements
        const isDropdownElement =
          e.target.closest('[role="combobox"]') ||
          e.target.closest(".select-trigger") ||
          e.target.closest("[cmdk-root]") ||
          e.target.closest("[data-radix-popper-content-wrapper]");

        if (isDropdownElement) return;
        if (type === "command" || cell.column.id === "Is Emergency") return;

        if (type === "list") {
          setShowList(true);
          return;
        }

        const hasInteractiveRenderer = [
          "category",
          "doctor",
          "paymentMode",
          "authorizedBy",
          "billNumber",
          "billNo",
          "status",
        ].includes(cell.column.id);

        if (hasInteractiveRenderer) return;

        setIsEditing(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }}
      className={`cursor-pointer border-b border-[#CDCED6] px-3 py-0 bg-white group-hover:bg-[#E6F4FE] group-hover:text-[#0D74CE]
      ${
        ["service", "services", "Service"].includes(cell.column.id)
          ? "sticky left-0 z-30"
          : ""
      }
      ${cell.column.id === "totalamt" ? "sticky right-0 z-30" : ""}
      ${className}`}
    >
      {showList && type === "list" ? (
        <Popover open={showList} onOpenChange={(open) => setShowList(open)}>
          <PopoverTrigger asChild>
            <button
              role="combobox"
              className="w-full rounded-t-none h-10 justify-between hover:bg-[#E6F4FE] border-none bg-transparent shadow-none"
              onClick={(e) => {
                e.stopPropagation();
                setShowList(!showList);
              }}
            >
              {value
                ? authorizedBy.find((ab) => ab.value === value)?.label
                : "Select Doctor..."}
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-full p-0 -translate-x-[13px] rounded-t-none border-none"
            sideOffset={-1}
            align="start"
            onInteractOutside={(e) => {
              e.preventDefault();
              setShowList(false);
            }}
          >
            <Command
              className={`${
                size === "small"
                  ? "w-[590px]"
                  : size === "large"
                  ? "w-[calc(100vw-962px)]"
                  : "w-[590px]"
              } border border-[#D9D9E0] rounded-t-none`}
            >
              <CommandInput 
                placeholder="Search Doctors..." 
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setShowList(false);
                  }
                }}
              />
              <CommandList className="max-h-[236px] overflow-y-auto">
                <CommandEmpty>No Doctor found.</CommandEmpty>
                <CommandGroup className="pt-2 pb-3 pl-0 pr-0">
                  {authorizedBy.map((ab) => (
                    <CommandItem
                      key={ab.value}
                      value={ab.value}
                      onSelect={(val) => {
                        selectListValue(val);
                        setShowList(false);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="hover:bg-[#E6F4FE] hover:text-[#0D74CE] data-[selected=true]:bg-[#E6F4FE] data-[selected=true]:text-[#0D74CE] h-9 px-4 py-1"
                    >
                      {ab.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      ) : isEditing ? (
        type === "select" ? (
          <Select value={value} onValueChange={(val) => setValue(val)}>
            <SelectTrigger className="h-10 w-full px-0 py-2 text-xs outline-none rounded-none border-none focus-visible:ring-[#5EB1EF]">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent className="py-0 px-0">
              {["Paid", "Pending", "Failed"].map((option) => (
                <SelectItem
                  key={option}
                  value={option}
                  className="cursor-pointer hover:bg-[#4099d8]"
                >
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <TooltipProvider>
            <Tooltip open={!!error}>
              <TooltipTrigger asChild>
                <Input
                  ref={inputRef}
                  value={value}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setValue(newValue);

                    const isNumericField = [
                      "rate",
                      "quantity",
                      "patientAmount",
                      "companyAmount",
                      "totalamt",
                      "concession",
                      "concessionAmt",
                      "paidAmount",
                      "amount",
                      "Rate",
                      "Quantity",
                      "Amount",
                      "GST (18%)",
                      "Concession",
                      "Total Amount",
                    ].includes(cell.column.id);

                    if (isNumericField) {
                      setError(
                        isValidNumber(newValue) ? null : "Enter a valid number"
                      );
                    }
                  }}
                  onBlur={handleBlur}
                  autoFocus
                  onKeyDown={handleKeyDown}
                  className={`min-w-[90px] text-black ${
                    error ? "bg-red-100 border border-red-500" : ""
                  }`}
                />
              </TooltipTrigger>
              <TooltipContent className="bg-[#DC3E42] text-white text-sm font-medium flex flex-row gap-1">
                <Image
                  src={"/assets/icons/InfoCircleWhite.svg"}
                  alt="Error"
                  width={16}
                  height={16}
                  className="rounded-lg"
                />
                {error}
                <TooltipArrow className="fill-[#DC3E42]" />
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      ) : (
        flexRender(cell.column.columnDef.cell, cell.getContext())
      )}
    </TableCell>
  );
};
