"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { appData } from "@/lib/sample-data"; // We'll use this for the <Select>

// --- 1. IMPORT CHANGES ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
// (Native radio inputs are used below)
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
  FieldDescription,
  FieldContent,
  FieldSeparator,
} from "@/components/ui/field";

// --- We no longer need Popover, Calendar, CalendarIcon, cn, or format ---


// --- 2. STATE TYPE CHANGES ---
type MaintenanceFormState = {
  linked_asset?: string;
  maintenance_type?: string;
  // maintenance_date?: Date; // <-- This is removed
  exp_month?: string; // <-- This is added
  exp_year?: string; // <-- This is added
  cost?: number;
  description?: string;
  is_completed?: boolean;
};

export default function NewRecordFormPage() {
  const params = useParams();
  const router = useRouter();
  const doctypeName = params.doctypeName as string;

  // --- 3. USESTATE (no change in function) ---
  const [formData, setFormData] = React.useState<MaintenanceFormState>({
    maintenance_type: "scheduled", 
    is_completed: false, 
  });

  // --- 4. STATE HANDLERS (Removed handleDateChange) ---
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  // This handler is now used for THREE select fields
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };
  
  const handleRadioChange = (name: string, value: string) => {
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  // (handleDateChange is removed)

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prevData => ({ ...prevData, [name]: checked }));
  };

  // --- 5. SUBMIT HANDLER (no change) ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); 
    console.log("New Maintenance Record Submitted!", formData);
    router.push(`/assets/${doctypeName}`);
  };

  // --- 6. JSX (Calendar field is replaced) ---
  return (
    <div className="module active">
      <form onSubmit={handleSubmit}>
        
        <div className="module-header">
          <div>
            <h2>New Maintenance Record</h2>
            <p>Create a new maintenance log for an asset.</p>
          </div>
          <Button type="submit">
            <i className="fas fa-save" style={{ marginRight: '8px' }}></i> Save Record
          </Button>
        </div>

        <div className="form-grid-2-col">
          
          {/* Column 1 */}
          <FieldGroup className="form-column">
            
            {/* --- Asset <Select> (No Change) --- */}
            <Field>
              <FieldLabel htmlFor="linked_asset">Asset</FieldLabel>
              <Select
                name="linked_asset"
                value={formData.linked_asset || ""}
                onValueChange={(value) => handleSelectChange("linked_asset", value)}
              >
                <SelectTrigger id="linked_asset">
                  <SelectValue placeholder="Select an asset" />
                </SelectTrigger>
                <SelectContent>
                  {appData.technical_data.map(asset => (
                    <SelectItem key={asset.pump_id} value={asset.pump_id}>
                      {asset.pump_id} ({asset.manufacturer})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                The asset this maintenance was for.
              </FieldDescription>
            </Field>

            {/* --- REPLACED CALENDAR WITH MONTH/YEAR --- */}
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="exp_month">Maintenance Month</FieldLabel>
                <Select
                  name="exp_month"
                  value={formData.exp_month || ""}
                  onValueChange={(value) => handleSelectChange("exp_month", value)}
                >
                  <SelectTrigger id="exp_month">
                    <SelectValue placeholder="MM" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="01">01</SelectItem>
                    <SelectItem value="02">02</SelectItem>
                    <SelectItem value="03">03</SelectItem>
                    <SelectItem value="04">04</SelectItem>
                    <SelectItem value="05">05</SelectItem>
                    <SelectItem value="06">06</SelectItem>
                    <SelectItem value="07">07</SelectItem>
                    <SelectItem value="08">08</SelectItem>
                    <SelectItem value="09">09</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="11">11</SelectItem>
                    <SelectItem value="12">12</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="exp_year">Maintenance Year</FieldLabel>
                <Select
                  name="exp_year"
                  value={formData.exp_year || ""}
                  onValueChange={(value) => handleSelectChange("exp_year", value)}
                >
                  <SelectTrigger id="exp_year">
                    <SelectValue placeholder="YYYY" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                    <SelectItem value="2027">2027</SelectItem>
                    <SelectItem value="2028">2028</SelectItem>
                    <SelectItem value="2029">2029</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            {/* --- END OF REPLACEMENT --- */}


            {/* --- RadioGroup (No Change) --- */}
            <FieldSet>
              <FieldLegend variant="label">Maintenance Type</FieldLegend>
              <div role="radiogroup" aria-labelledby="maintenance-type" className="mt-2">
                <Field orientation="horizontal">
                  <input
                    type="radio"
                    name="maintenance_type"
                    id="r1"
                    value="scheduled"
                    checked={formData.maintenance_type === "scheduled"}
                    onChange={() => handleRadioChange("maintenance_type", "scheduled")}
                  />
                  <FieldLabel htmlFor="r1" className="font-normal">Scheduled</FieldLabel>
                </Field>
                <Field orientation="horizontal">
                  <input
                    type="radio"
                    name="maintenance_type"
                    id="r2"
                    value="breakdown"
                    checked={formData.maintenance_type === "breakdown"}
                    onChange={() => handleRadioChange("maintenance_type", "breakdown")}
                  />
                  <FieldLabel htmlFor="r2" className="font-normal">Breakdown / Repair</FieldLabel>
                </Field>
                <Field orientation="horizontal">
                  <input
                    type="radio"
                    name="maintenance_type"
                    id="r3"
                    value="inspection"
                    checked={formData.maintenance_type === "inspection"}
                    onChange={() => handleRadioChange("maintenance_type", "inspection")}
                  />
                  <FieldLabel htmlFor="r3" className="font-normal">Inspection</FieldLabel>
                </Field>
              </div>
            </FieldSet>
          </FieldGroup>
          
          {/* Column 2 (No Change) */}
          <FieldGroup className="form-column">

            <Field>
              <FieldLabel htmlFor="cost">Cost (₹)</FieldLabel>
              <Input
                name="cost"
                id="cost"
                type="number"
                placeholder="0.00"
                value={formData.cost || ""}
                onChange={handleChange}
              />
            </Field>
            
            <Field>
              <FieldLabel htmlFor="description">Description of Work</FieldLabel>
              <Textarea
                name="description"
                id="description"
                placeholder="Describe the work performed..."
                value={formData.description || ""}
                onChange={handleChange}
                rows={8}
              />
            </Field>
            
            <Field orientation="horizontal" className="flex items-center justify-between rounded-lg border p-4" style={{ backgroundColor: 'var(--color-surface)' }}>
              <FieldContent>
                <FieldLabel htmlFor="is_completed">Mark as Completed</FieldLabel>
                <FieldDescription>
                  Check this if all work is finished.
                </FieldDescription>
              </FieldContent>
              <Checkbox
                name="is_completed"
                id="is_completed"
                checked={formData.is_completed || false}
                onCheckedChange={(checked) => handleCheckboxChange("is_completed", checked as boolean)}
              />
            </Field>

          </FieldGroup>
        </div>

        <FieldSeparator style={{ margin: 'var(--space-24) 0' }} />

        <Field orientation="horizontal">
          <Button type="submit">Submit</Button>
          <Button variant="outline" type="button" onClick={() => router.back()}>
            Cancel
          </Button>
        </Field>
        
      </form>
    </div>
  );
}