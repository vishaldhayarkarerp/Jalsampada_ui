import { DataTable } from "./TableTry";

const initialData = [
  { id: "1", service: "John Doe", amount: "100", status: "Paid" },
  { id: "2", service: "Jane Smith", amount: "250", status: "Pending" },
  { id: "3", service: "Alex Johnson", amount: "75", status: "Failed" },
];
const getRowClassName = (row) =>
  row.original.tag === "Cancelled" ? "line-through opacity-50" : "";

const columns = [
  {
    accessorKey: "service",
    header: "Service",
    cell: ({ getValue }) => <span>{getValue()}</span>,
    enableSorting: true,
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <span className="text-right w-full block">Amount</span>
    ),
    cell: ({ getValue }) => (
      <span className="text-right w-full block">₹{getValue()}</span>
    ),
    enableSorting: true,
    sortingFn: "alphanumeric",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => <span>{getValue()}</span>,
    enableSorting: true,
    isSelect: true,
  },
];

export default function Page() {
  return (
    <DataTable
      columns={columns}
      initialData={initialData}
      getRowClassName={getRowClassName}
      addButton={true}
    />
  );
}
