"use client";

import { useEffect, useRef, useState } from "react";
import { ColumnDef, flexRender, Table, Cell } from "@tanstack/react-table";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { v4 as uuidv4 } from "uuid";

interface DataPropsType<T> {
  data: T[];
  setData: React.Dispatch<React.SetStateAction<T[]>>;
}
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    isNumeric?: boolean;
  }
}

export type CustomColumnDef<T extends { id: string | number }> =
  ColumnDef<T> & {
    isCommand?: boolean;
    isList?: boolean;
    accessorKey?: string;
  };

interface DataTableProps<T extends { id: string | number }> {
  columns: CustomColumnDef<T>[];
  initialData: T[];
  addButton?: boolean;
  table: Table<T>;
  dataProps?: DataPropsType<T>;
  size?: "small" | "medium" | "large";
  dependentRelations?: { value: string; label: string }[];
}

export function DataTable<T extends { id: string | number }>({
  columns,
  initialData,
  addButton,
  table,
  dataProps,
  size = "small",
  dependentRelations,
}: DataTableProps<T>) {




  const [showAddButton, setShowAddButton] = useState(true);
  const [showCommand, setShowCommand] = useState(false);
  const [showList, setShowList] = useState(false);
  const [showDependentList, setShowDependentList] = useState(false);
  const [showServiceList, setShowServiceList] = useState(false);
  const [, setSelectedRow] = useState<number | null>(null);
  const [showRowActions, setShowRowActions] = useState(false);
  const [showInputRow, setShowInputRow] = useState(false);
  const [initialInput, setInitialInput] = useState("");
  const [error, setError] = useState<null | string>(null);
  const patientInputRef = useRef<HTMLInputElement | null>(null);
  const cellRefs = useRef<HTMLTableCellElement[][]>([]);

  const data = dataProps?.data;
  const setData = dataProps?.setData;


  const selectedRows = table
    .getSelectedRowModel()
    .rows.map((row) => row.original);

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
    setData((prev: T[]) =>
      prev.filter((item: T) => !selectedIds.includes(item.id))
    );
    deselectRows();
  };

  const openCommand = (rowIndex: number) => {
    setSelectedRow(rowIndex);
    setShowCommand(true);
  };

  const openList = (rowIndex: number) => {
    setSelectedRow(rowIndex);
    setShowList(true);
    setShowServiceList(true);
  };

  const selectCommandValue = (value: string) => {
    if (!setData) return;
    setData((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        service: value,
        amount: "",
        status: "Pending",
      } as unknown as T,
    ]);
    setShowCommand(false);
    setShowAddButton(true);
  };

  const selectRelationValue = (value: string) => {
    if (!setData) return;

    // Find the selected relation from dependentRelations to get the correct value
    const selectedRelation = dependentRelations?.find((relation: any) => relation.key === value);
    const relationValue = selectedRelation?.value || value;

    setData((prev: T[]) => [
      ...prev,
      {
        id: prev.length + 1,
        dependentRelation: relationValue,
        dependentRelationId: value, // Store the key for reference
        maxDependents: 1,
        fromAge: 0,
        toAge: 100,
      } as unknown as T,
    ]);
    setShowDependentList(false);
    setShowAddButton(true);
  };

  const handleUpdate = (id: string, field: string, value: string) => {
    if (!setData) return;
    setData((prevData: T[]) =>
      prevData.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const showNew = (isCommand: boolean) => {
    setShowAddButton(false);
    setShowCommand(isCommand);
    setShowInputRow(!isCommand);
  };

  const _showNewList = (isList: boolean) => {
    if (columns[0]?.accessorKey === "dependentRelation") {
      setShowDependentList(true);
    } else {
      setShowList(isList);
    }

    setShowInputRow(!isList);
  };
  useEffect(() => {
    if (showInputRow && columns[0]?.id === "service") {
      setShowCommand(true);
    }
    if (showInputRow && columns[0]?.id === "authorizedBy") {
      setShowList(true);
    }
    if (showInputRow && columns[0]?.id === "serviceName") {
      setShowServiceList(true);
    }
    if (showInputRow && columns[0]?.id === "dependentRelation") {
      setShowDependentList(true);
    }
  }, [showInputRow, columns]);

  useEffect(() => {
    if (showInputRow && patientInputRef.current) {
      patientInputRef.current.focus();
    }
  }, [showInputRow]);

  const addRow = (values: Partial<T>) => {
    if (!setData) return;
    setShowInputRow(false);
    const inputValue = Object.values(values)[0];

    if (columns[0]?.accessorKey === "paidAmount") {
      setData((prev) => [
        ...prev,
        {
          id: uuidv4(),
          paidAmount: inputValue,
          receiptDate: new Date().toISOString(),
          transactionnumber: "",
          bankname: "",
          modeOfPaymentId: "9f00d4cb-8e82-4df1-949b-7f447cfbe9d4",
          modeOfPayment: "",
          chequeno: "",
          chequedate: new Date().toISOString(),
          branchname: "",
          approvalNumber: null,
        } as unknown as T,
      ]);
      setShowAddButton(true);
    } else {
      setData((prev) => [
        ...prev,
        {
          id: uuidv4(),
          amount: inputValue,
          receiptDate: new Date().toISOString(),
          transactionnumber: "",
          bankname: "",
          modeOfPaymentId: null,
          modeOfPayment: "",
          chequeno: "",
          chequedate: null,
          branchname: "",
          approvalNumber: null,
        } as unknown as T,
      ]);
    }
  };

  const removeRow = () => {
    setShowInputRow(false);
    setShowAddButton(true);
  };

  useEffect(() => {
    if (!data) return;
    // focusNextCell(data.length - 1, 0);
  }, [data, data?.length]);

  const focusNextCell = (rowIndex: number, columnIndex: number) => {
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
                    ${[
                        "serviceName",
                        "services",
                        "Service",
                        "amount",
                        "authorizedBy",
                      ].includes(header.column.id) || header.column.id === headerGroup.headers[0]?.id
                        ? "sticky left-0 z-50 bg-[#F9F9FB]"
                        : ""
                      }
                    ${header.column.id === "totalamt"
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
                            : cell.column.id === "serviceName"
                              ? "list"
                              : cell.column.id === "dependentRelation"
                                ? "dependent"
                                : "text"
                      }
                      openCommand={openCommand}
                      openList={openList}
                      columns={columns}
                      addButton={addButton}
                      initialData={initialData}
                      size={size}

                      dependentRelations={dependentRelations}
                      ref={(el: HTMLTableCellElement) => {
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
            rows={selectedRows.map((row) => row.id)}
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
                        setInitialInput(value);
                        // Check if the first column is numeric
                        const isNumericColumn =
                          columns[0]?.id === "amount" ||
                          columns[0]?.id === "rate" ||
                          columns[0]?.id === "quantity" ||
                          columns[0]?.id === "totalamt" ||
                          columns[0]?.id === "Rate" ||
                          columns[0]?.accessorKey === "paidAmount";

                        if (isNumericColumn) {
                          const isValidNumber = /^\d*\.?\d*$/.test(value);

                          if (!isValidNumber) {
                            setError("Enter a valid number");
                          } else if (
                            columns[0]?.id === "quantity" &&
                            value.length > 2
                          ) {
                            setError("Quantity must be a 2-digit number");
                          } else if (Number(value) > 0) {
                            setError(
                              `Value cannot exceed total amount 0)`
                            );
                          } else {
                            setError(null);
                          }
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
                            columns[0]?.id === "amount" ||
                            columns[0]?.id === "totalamt" ||
                            columns[0]?.id === "Rate" ||
                            columns[0]?.accessorKey == "paidAmount";

                          if (isNumericColumn) {
                            if (
                              initialInput.trim() &&
                              /^\d*\.?\d*$/.test(initialInput)
                            ) {
                              addRow({
                                [(columns[0]?.id as string) ?? ""]:
                                  initialInput,
                              } as Partial<T>);
                              setShowInputRow(false);
                              setShowAddButton(true);
                              setInitialInput("");
                              setError(null);
                            }
                          } else {
                            if (initialInput.trim()) {
                              addRow({
                                [(columns[0]?.id as string) ?? ""]:
                                  initialInput,
                              } as Partial<T>);
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
                      className={`flex-1 border-none shadow-none focus-visible:ring-0 ${error ? "bg-red-100 border border-red-500" : ""
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
                      columns[0]?.id === "amount" ||
                      columns[0]?.id === "totalamt" ||
                      columns[0]?.id === "Rate";

                    if (isNumericColumn) {
                      if (
                        initialInput.trim() &&
                        /^\d*\.?\d*$/.test(initialInput)
                      ) {
                        addRow({
                          [(columns[0]?.id as string) ?? ""]: initialInput,
                        } as Partial<T>);
                        setShowInputRow(false);
                        setShowAddButton(true);
                        setInitialInput("");
                      }
                    } else {
                      if (initialInput.trim()) {
                        addRow({
                          [(columns[0]?.id as string) ?? ""]: initialInput,
                        } as Partial<T>);
                        setShowInputRow(false);
                        setShowAddButton(true);
                        setInitialInput("");
                      }
                    }
                  }}
                  disabled={
                    !initialInput.trim() ||
                    (columns[0]?.id === "amount" &&
                      !/^\d*\.?\d*$/.test(initialInput)) ||
                    !!error
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
                className="flex items-center gap-2 cursor-pointer px-3"
                onClick={() => {
                  // For dependent relations, show dropdown like employee category
                  const isList = columns.some((col) => col.isList === true);
                  if (isList && dependentRelations && dependentRelations.length > 0) {
                    setShowDependentList(true);
                    setShowAddButton(false);
                    return;
                  }

                  const isCommand = columns.some(
                    (col) => col.isCommand === true
                  );
                  showNew(isCommand);
                  if (isCommand) {
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
                  size="icon"
                  type="button"
                  variant="link"
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
            side="bottom"
            align="start"
            sideOffset={-15}
            className="w-[768px] p-0 shadow-none border-none -translate-x-[1px] z-[350]"
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
              aria-controls="command-list"
              aria-expanded={showList}
              className="w-full rounded-t-none h-10 justify-between hover:bg-[#E6F4FE] hover:text-[#0D74CE] border-none"
              onClick={(e) => {
                e.stopPropagation();
                setShowList(!showList);
              }}
            >

            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-full p-0 shadow-none border-[#D9D9E0] z-[350]"
            sideOffset={-630}
            onInteractOutside={(e) => {
              e.preventDefault();
              setShowList(false);
            }}
          >
            <Command
              className={`${size === "small"
                ? "w-[590px]"
                : size === "large"
                  ? "w-[calc(100vw-962px)]"
                  : "w-[590px]"
                }  shadow-none rounded-b-none`}
            >
              <CommandInput
                placeholder="Search Doctors..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setShowList(false);
                  }
                }}
              />

            </Command>
          </PopoverContent>
        </Popover>
      )}
      {showServiceList && (
        <Popover
          open={showServiceList}
          onOpenChange={(open) => {
            setShowServiceList(open);
            if (!open) setShowAddButton(true); // Ensure "Add New" shows when command closes
          }}
        >
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-controls="command-list"
              aria-expanded={showServiceList}
              className="w-full rounded-t-none h-10 justify-between hover:bg-[#E6F4FE] hover:text-[#0D74CE] border-none"
              onClick={(e) => {
                e.stopPropagation();
                setShowServiceList(!showServiceList);
              }}
            >

            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-full p-0 shadow-none border-[#D9D9E0] z-[350]"
            sideOffset={-630}
            onInteractOutside={(e) => {
              e.preventDefault();
              setShowServiceList(false);
            }}
          >
            <Command
              className={`${size === "small"
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
                    setShowServiceList(false);
                  }
                }}
              />

            </Command>
          </PopoverContent>
        </Popover>
      )}
      {showDependentList && (
        <div className="bg-white border border-[#D9D9E0] rounded-t-none">
          <Select onValueChange={(value) => {
            selectRelationValue(value);
            setShowDependentList(false);
            setShowAddButton(true);
          }}>
            <SelectTrigger className="w-full h-10 rounded-t-none border-none">
              <SelectValue placeholder="Select Relation" />
              <Image
                src="/assets/icons/CaretDownDark.svg"
                height={16}
                width={16}
                alt="dropdown"
              />
            </SelectTrigger>
            <SelectContent className="border border-[#D9D9E0] [&>div]:!px-0 [&>div]:!py-0">
              <Command>
                <CommandInput placeholder="Search Relations..." />
                <CommandList className="[&>div]:!px-0 [&>div]:!mx-0 [&>div]:!pb-2">
                  <CommandEmpty>No Relation found.</CommandEmpty>
                  <CommandGroup>
                    {dependentRelations?.map((relation: any) => (
                      <CommandItem
                        key={relation.key}
                        value={relation.key}
                        onSelect={() => {
                          selectRelationValue(relation.key);
                          setShowDependentList(false);
                          setShowAddButton(true);
                        }}
                        className="flex items-center px-4 py-2 text-sm text-[#1C2024] hover:bg-[#E6F4FE] hover:text-[#0D74CE] data-[selected=true]:bg-[#E6F4FE] data-[selected=true]:text-[#0D74CE] cursor-pointer"
                      >
                        {relation.value}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

interface EditableCellProps<T extends { id: string | number }> {
  cell: Cell<T, unknown>;
  onUpdate: (rowId: string, columnId: string, value: string) => void;
  focusNextCell: (rowIndex: number, columnIndex: number) => void;
  rowIndex: number;
  columnIndex: number;
  ref?: (el: HTMLTableCellElement) => void;
  type?: "command" | "list" | "select" | string;
  index?: number;
  columns?: CustomColumnDef<T>[];
  addButton?: boolean;
  initialData?: T[];
  size?: "small" | "large" | string;
  className?: string;
  openCommand?: (rowIndex: number) => void;
  openList?: (rowIndex: number) => void;
  authorizedBy?: { value: string; label: string }[];
  serviceList?: { value: string; label: string }[];
  dependentRelations?: { value: string; label: string }[];
}

const EditableCell = <T extends { id: string | number }>({
  cell,
  onUpdate,
  focusNextCell,
  rowIndex,
  columnIndex,
  ref,
  type,
  size,
  className,
  authorizedBy = [],
  serviceList = [],
  dependentRelations = [],
}: EditableCellProps<T>) => {
  const [value, setValue] = useState<string>(String(cell.getValue?.() ?? ""));
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showList, setShowList] = useState<boolean>(false);
  const [showDependentList, setShowDependentList] = useState(false);
  const [showServiceList, setShowServiceList] = useState<boolean>(false);

  // Handle keyboard events for dropdowns
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowList(false);
        setShowServiceList(false);
        setShowDependentList(false);
      }
    };

    if (showList || showServiceList || showDependentList) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [showList, showServiceList, showDependentList]);

  const isDoctorList = showList && type === "list";
  const isServiceList = showServiceList && type === "list";
  const isDependentlist = showDependentList && type === "list";

  const options = isDoctorList
    ? authorizedBy
    : isServiceList
      ? serviceList
      : isDependentlist
        ? dependentRelations
        : [];

  const selectedLabel = options.find((item) => item.value === value)?.label;

  const isValidNumber = (val: string): boolean => {
    if (typeof val !== "string") return false;

    if (cell.column.id === "quantity") {
      return /^\d+$/.test(val) && parseInt(val) > 0;
    }

    if (cell.column.id === "concessionPercent") {
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
      setValue(String(cell.getValue?.() ?? ""));
    }
  }, [cell, isEditing]);

  const handleBlur = () => {
    const isNumericField = cell.column.columnDef.meta?.isNumeric === true;

    if (isNumericField && !isValidNumber(value)) {
      setValue(String(cell.getValue() ?? ""));
      setError(null);
    } else {
      setError(null);
      const initialValue = cell.getValue();
      if (value !== initialValue) {
        onUpdate(String(cell.row.original.id), cell.column.id, value);
      }
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      handleBlur();
      focusNextCell(rowIndex, columnIndex);
    }
  };

  const selectListValue = (newValue: string) => {
    if (value !== newValue) {
      setValue(newValue);
      onUpdate(String(cell.row.original.id), cell.column.id, newValue);
    }
    setShowList(false);
    setShowServiceList(false);
    setShowDependentList(false);
  };
  const isNonEditable = cell.column.columnDef.meta?.noneditable ?? false;
  if (isNonEditable) {
    return (
      <TableCell
        ref={ref}
        className={`  ${cell.column.id === "totalamt"
          ? "sticky right-0 z-50 bg-[#F9F9FB]"
          : columnIndex === 0
            ? "sticky left-0 z-30 bg-white"
            : ""
          }  border-b border-[#CDCED6] px-3 py-0 bg-white group-hover:bg-[#E6F4FE] group-hover:text-[#0D74CE]`}
      >
        {flexRender(cell.column.columnDef.cell, cell.getContext())}
      </TableCell>
    );
  }
  return (
    <TableCell
      ref={ref}
      onClick={(e) => {
        const isDropdownElement =
          (e.target as HTMLElement).closest('[role="combobox"]') ||
          (e.target as HTMLElement).closest(".select-trigger") ||
          (e.target as HTMLElement).closest("button") ||
          (e.target as HTMLElement).closest("[cmdk-root]") ||
          (e.target as HTMLElement).closest(
            "[data-radix-popper-content-wrapper]"
          );

        if (isDropdownElement) return;
        if (type === "command" || cell.column.id === "Is Emergency") return;

        if (type === "list") {
          setShowList(true);
          setShowServiceList(true);
          // Don't show dependent list dropdown
          // setShowDependentList(true);
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
          "serviceName",
        ].includes(cell.column.id);

        if (hasInteractiveRenderer) return;

        setIsEditing(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }}
      className={`cursor-pointer border-b border-[#CDCED6] px-3 py-0 bg-white group-hover:bg-[#E6F4FE] group-hover:text-[#0D74CE]
      ${[
          "serviceName",
          "services",
          "Service",
          "amount",
          "authorizedBy",
        ].includes(cell.column.id) || columnIndex === 0
          ? "sticky left-0 z-30"
          : ""
        }
      ${cell.column.id === "totalamt" ? "sticky right-0 z-30" : ""}
      ${className}`}
    >
      {(type === "list" || type === "dependent") &&
        (showList || showServiceList) ? (
        <Popover
          open={showList || showServiceList}
          onOpenChange={(open) => {
            setShowList(open);
            setShowServiceList?.(open);
          }}
        >
          <PopoverTrigger asChild>
            <button
              role="combobox"
              aria-controls="command-list"
              aria-expanded={showList}
              className="w-full rounded-t-none h-10 justify-between hover:bg-[#E6F4FE] border-none bg-transparent shadow-none"
            >
              {selectedLabel || "Select..."}
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-full p-0 -translate-x-[13px] rounded-t-none border-none z-[350]"
            sideOffset={-1}
            align="start"
          >
            <Command
              className={`${size === "small"
                ? "w-[590px]"
                : size === "large"
                  ? "w-[calc(100vw-962px)]"
                  : "w-[590px]"
                } border border-[#D9D9E0] rounded-t-none`}
            >
              <CommandInput placeholder="Search..." />
              <CommandList className="max-h-[236px] overflow-y-auto">
                <CommandEmpty>No options found.</CommandEmpty>
                <CommandGroup className="pt-2 pb-3 pl-0 pr-0">
                  {(type === "dependent"
                    ? ["Father", "Mother", "Spouse", "Child"]
                    : options
                  ).map((item) => {
                    const value = typeof item === "string" ? item : item.value;
                    const label = typeof item === "string" ? item : item.label;
                    return (
                      <CommandItem
                        key={label}
                        value={value}
                        onSelect={(val) => {
                          if (type === "dependent") {
                            selectListValue(val); // You may use another handler like selectDependentValue
                          } else {
                            selectListValue(val);
                          }
                          setShowList(false);
                          setShowServiceList?.(false);
                          setShowDependentList(false);
                        }}
                        className="hover:bg-[#E6F4FE] hover:text-[#0D74CE] data-[selected=true]:bg-[#E6F4FE] data-[selected=true]:text-[#0D74CE] h-9 px-4 py-1"
                      >
                        {label}
                      </CommandItem>
                    );
                  })}
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

                    const columnId = cell.column.id;
                    const isNumericField =
                      cell.column.columnDef.meta?.isNumeric === true;

                    if (isNumericField) {
                      if (!isValidNumber(newValue)) {
                        setError("Enter a valid number");
                      } else if (
                        columnId === "quantity" &&
                        newValue.length > 2
                      ) {
                        setError("Quantity must be at most 2 digits");
                        return;
                      } else if (columnId === "rate" && newValue.length > 8) {
                        setError("Rate must be at most 8 digits");
                      } else {
                        setError(null);
                      }
                    } else {
                      setError(
                        newValue.trim() ? null : "Field cannot be empty"
                      );
                    }
                    setValue(newValue);
                  }}
                  onBlur={handleBlur}
                  autoFocus
                  onKeyDown={handleKeyDown}
                  className={`min-w-[90px] text-black ${error ? "bg-red-100 border border-red-500" : ""
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
