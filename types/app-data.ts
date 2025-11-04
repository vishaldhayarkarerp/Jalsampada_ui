// Type definitions matching the original app.js data structure

export interface TechnicalData {
  pump_id: string;
  pump_type: string;
  capacity_lps: number;
  head_m: number;
  power_kw: number;
  voltage_v: number;
  current_a: number;
  commissioning_year: number;
  manufacturer: string;
  model: string;
  location: string;
}

export interface OperationData {
  timestamp: string;
  pump_id: string;
  status: "Running" | "Stopped";
  flow_rate_lps: number;
  head_m: number;
  current_a: number;
  voltage_v: number;
  power_kw: number;
  temperature_c: number;
  vibration_mm_s: number;
  bearing_temp_c: number;
}

export interface SparePart {
  part_id: string;
  description: string;
  pump_model: string;
  quantity: number;
  min_stock: number;
  unit_cost: number;
  supplier: string;
  status: "In Stock" | "Low Stock" | "Out of Stock";
}

export interface MaintenanceRecord {
  record_id: string;
  pump_id: string;
  date: string;
  type: "Preventive" | "Corrective" | "Emergency";
  description: string;
  parts_used: string[];
  cost: number;
  technician: string;
  status: "Completed" | "In Progress" | "Scheduled";
}

export interface AppData {
  technical_data: TechnicalData[];
  operation_data: OperationData[];
  spare_parts: SparePart[];
  maintenance_records: MaintenanceRecord[];
}
