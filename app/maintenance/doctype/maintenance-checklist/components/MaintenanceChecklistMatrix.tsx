"use client";

import * as React from "react";
import axios from "axios";
import { useFormContext, useWatch } from "react-hook-form";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

// 🟢 UPDATED: Use the exact endpoint you found in inspection
const API_ENDPOINT = "http://103.219.1.138:4412/api/method/run_doc_method";

interface MatrixData {
  assets: { name: string }[];
  parameters: { name: string }[];
}

interface ChecklistItem {
  asset: string;
  parameter: string;
  checked: 0 | 1; 
  description?: string;
}

export function MaintenanceChecklistMatrix() {
  const { apiKey, apiSecret } = useAuth();
  const { control, setValue, getValues } = useFormContext();
  
  // 1. Watch dependencies (Inputs required to fetch the matrix)
  const [lisName, stage, assetCategory, monitoringType] = useWatch({
    control,
    name: ["lis_name", "stage", "asset_category", "monitoring_type"],
  });

  // 2. Local State
  const [matrix, setMatrix] = React.useState<MatrixData | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [assetSearch, setAssetSearch] = React.useState("");

  // 3. Watch the actual data field (Child Table)
  const checklistData: ChecklistItem[] = useWatch({
    control,
    name: "checklist_data",
  }) || [];

  // 4. Fetch Matrix (The Logic You Inspected)
  React.useEffect(() => {
    const fetchMatrix = async () => {
      // Only fetch if all criteria are selected
      if (!lisName || !stage || !assetCategory || !monitoringType || !apiKey || !apiSecret) {
        setMatrix(null);
        return;
      }

      setLoading(true);
      try {
        // 🟢 CONSTRUCT THE PAYLOAD EXACTLY LIKE FRAPPE
        const docPayload = {
          name: "new-maintenance-checklist-" + Math.random().toString(36).substring(7), // Random temp name
          owner: "administrator", // Placeholder, backend handles actual user
          docstatus: 0,
          doctype: "Maintenance Checklist",
          lis_name: lisName,
          stage: stage,
          asset_category: assetCategory,
          monitoring_type: monitoringType,
          checklist_data: [],
          __islocal: 1, // Tells Frappe this is an unsaved doc
          __unsaved: 1
        };

        // Form Data is required for run_doc_method usually
        const params = new URLSearchParams();
        params.append("docs", JSON.stringify(docPayload));
        params.append("method", "get_matrix_data"); // The python method name

        const resp = await axios.post(API_ENDPOINT, params, {
          headers: { 
            Authorization: `token ${apiKey}:${apiSecret}`,
            "Content-Type": "application/x-www-form-urlencoded" // Important for standard Frappe API calls
          },
          withCredentials: true,
        });

        // 🟢 PARSE THE RESPONSE (structure: { message: { assets: [], parameters: [] } })
        if (resp.data.message) {
          setMatrix(resp.data.message);
        } else {
            // Sometimes message is wrapped differently, log if empty
            console.warn("Matrix response empty:", resp.data);
            setMatrix(null);
        }
      } catch (error) {
        console.error("Failed to fetch matrix data", error);
        toast.error("Failed to load checklist matrix");
      } finally {
        setLoading(false);
      }
    };

    // Debounce to prevent API spam while typing/selecting
    const timer = setTimeout(fetchMatrix, 500);
    return () => clearTimeout(timer);
  }, [lisName, stage, assetCategory, monitoringType, apiKey, apiSecret]);


  // 5. Update Helper (Writes back to the form)
  const updateEntry = (asset: string, parameter: string, updates: Partial<ChecklistItem>) => {
    const currentData = getValues("checklist_data") || [];
    const index = currentData.findIndex((d: ChecklistItem) => d.asset === asset && d.parameter === parameter);

    let newData = [...currentData];

    if (index >= 0) {
      // Update existing
      const existingEntry = newData[index];
      
      // If clicking the same state again, remove the entry (return to unchecked state)
      if (updates.checked !== undefined && existingEntry.checked === updates.checked) {
        newData.splice(index, 1);
      } else {
        // Otherwise update to the new state
        newData[index] = { ...existingEntry, ...updates };
        // Logic: If checking PASS (1), clear description
        if (updates.checked === 1) {
          newData[index].description = "";
        }
      }
    } else {
      // Add new
      newData.push({
        doctype: "Maintenance Checklist Item", // Ensure child doctype name is correct
        asset,
        parameter,
        checked: 0, 
        description: "",
        ...updates
      });
    }

    setValue("checklist_data", newData, { shouldDirty: true, shouldValidate: true });
  };

  // 6. Render
  if (loading) return <div className="p-8 text-center text-sm text-gray-500 animate-pulse bg-gray-50 rounded border">Loading checklist configuration...</div>;
  if (!matrix || !matrix.assets || matrix.assets.length === 0) return null;

  const filteredAssets = matrix.assets.filter(a => 
    a.name.toLowerCase().includes(assetSearch.toLowerCase())
  );

  return (
    <div className="border rounded-md shadow-sm overflow-hidden bg-white">
        {/* Header / Search */}
        <div className="p-3 bg-gray-50 border-b flex items-center justify-between">
            <h4 className="font-medium text-sm text-gray-700">Checklist Matrix</h4>
            <input 
                type="text" 
                placeholder="Search Asset..." 
                className="text-sm p-1.5 px-3 border rounded-md w-64 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={assetSearch}
                onChange={(e) => setAssetSearch(e.target.value)}
            />
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-sm border-collapse">
                <thead className="bg-orange-100 text-gray-700 sticky top-0 z-10 shadow-sm">
                    <tr>
                        <th className="p-3 border-b border-r text-left min-w-[200px] font-semibold">Asset</th>
                        {matrix.parameters.map(p => (
                            <th key={p.name} className="p-3 border-b border-r text-center min-w-[180px] font-semibold bg-orange-200/50">
                                {p.name}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredAssets.map(asset => (
                        <tr key={asset.name} className="hover:bg-gray-50 transition-colors">
                            <td className="p-3 border-r font-medium text-gray-900 bg-gray-50/30 sticky left-0 z-1">{asset.name}</td>
                            
                            {matrix.parameters.map(param => {
                                // Find value in local state
                                const entry = checklistData.find(d => d.asset === asset.name && d.parameter === param.name);
                                const isChecked = entry?.checked === 1; // Pass
                                const isFailed = entry?.checked === 0 && entry !== undefined; // Fail (Explicitly checked 0)
                                const description = entry?.description || "";

                                return (
                                    <td key={`${asset.name}-${param.name}`} className="p-2 border-r text-center align-top min-w-[180px]">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="flex items-center gap-4 bg-gray-100/50 p-1.5 rounded-full border border-gray-200">
                                                {/* PASS BUTTON */}
                                                <button 
                                                    type="button"
                                                    onClick={() => updateEntry(asset.name, param.name, { checked: 1 })}
                                                    className={`cursor-pointer flex items-center gap-1 px-2 py-0.5 rounded-full transition-all ${isChecked ? 'bg-green-100 text-green-700 font-bold shadow-sm' : 'text-gray-400 hover:text-green-600'}`}
                                                >
                                                    <span>✓</span>
                                                </button>

                                                <div className="w-px h-4 bg-gray-300"></div>

                                                {/* FAIL BUTTON */}
                                                <button 
                                                    type="button"
                                                    onClick={() => updateEntry(asset.name, param.name, { checked: 0 })}
                                                    className={`cursor-pointer flex items-center gap-1 px-2 py-0.5 rounded-full transition-all ${isFailed ? 'bg-red-100 text-red-700 font-bold shadow-sm' : 'text-gray-400 hover:text-red-600'}`}
                                                >
                                                    <span>✕</span>
                                                </button>
                                            </div>

                                            {/* Description (Only show if Failed/0) */}
                                            {isFailed && (
                                                <textarea 
                                                    placeholder="Reason for failure..."
                                                    className="w-full text-xs p-2 border rounded-md resize-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-red-50/30 animate-in fade-in slide-in-from-top-1"
                                                    rows={2}
                                                    value={description}
                                                    onChange={(e) => updateEntry(asset.name, param.name, { description: e.target.value })}
                                                />
                                            )}
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
}