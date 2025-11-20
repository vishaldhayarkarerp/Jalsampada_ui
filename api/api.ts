import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext"; // Adjust the import path as needed

const FRAPPE_BASE_URL = "http://192.168.1.30:4429/";

const buildFrappeApiUrl = (resource: string, fields: string[], filters?: any[]) => {
  const baseUrl = `${FRAPPE_BASE_URL}/api/resource/${encodeURIComponent(resource)}`;
  const params = new URLSearchParams();
  params.append("fields", JSON.stringify(fields));
  params.append("limit_page_length", "10000");
  if (filters && filters.length > 0) {
    params.append("filters", JSON.stringify(filters));
  }
  return `${baseUrl}?${params.toString()}`;
};

const makeFrappeApiCall = async (url: string, resourceName: string, apiKey: string, apiSecret: string) => {
  try {
    console.log(`Fetching ${resourceName} with API key authentication...`);
    const authHeader = `token ${apiKey}:${apiSecret}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: authHeader,
      },
      mode: "cors",
      cache: "no-cache",
    });

    console.log(`${resourceName} API Response Status:`, response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`${resourceName} API Error Response:`, errorText);
      if (response.status === 401 || response.status === 403) {
        throw new Error(`Authentication failed: ${response.status} - ${response.statusText}`);
      } else {
        throw new Error(`HTTP error: ${response.status} - ${response.statusText}`);
      }
    }

    const data = await response.json();
    console.log(`${resourceName} API Response Data:`, data);

    if (!data || !data.data || !Array.isArray(data.data)) {
      console.error("Invalid response format:", data);
      throw new Error("Invalid response format from API");
    }

    return data.data;
  } catch (error) {
    console.error(`Fetch ${resourceName} Error:`, error);
    throw error;
  }
};

// Custom hook to handle Frappe API calls with auth context and caching
export const useFrappeApi = () => {
  const { apiKey, apiSecret } = useAuth();
  const isAuthenticated = !!apiKey && !!apiSecret;

  // State to cache API results
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [kits, setKits] = useState<any[]>([]);
  const [classifications, setClassifications] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [localBranches, setLocalBranches] = useState<any[]>([]);
  const [subDepartments, setSubDepartments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);

  // Fetch warehouses
  const fetchWarehouses = useCallback(async () => {
    if (!isAuthenticated) {
      console.error("Not authenticated. Cannot fetch warehouses.");
      throw new Error("Authentication required to fetch warehouses.");
    }

    if (warehouses.length > 0) {
      console.log("Returning cached warehouses:", warehouses);
      return warehouses;
    }

    const WAREHOUSE_API_URL = `${FRAPPE_BASE_URL}/api/resource/Warehouse?fields=["name","warehouse_name"]&limit_page_length=10000`;

    try {
      const data = await makeFrappeApiCall(WAREHOUSE_API_URL, "Warehouses", apiKey!, apiSecret!);
      const warehouseData = data.map((warehouse: any) => ({
        name: warehouse.name,
        warehouse_name: warehouse.warehouse_name || warehouse.name,
        label: warehouse.warehouse_name || warehouse.name,
        value: warehouse.name,
      }));
      console.log("Warehouses loaded successfully:", warehouseData);
      setWarehouses(warehouseData);
      return warehouseData;
    } catch (error) {
      let errorMessage = "Error loading warehouses";
      if (error instanceof Error) {
        if (error.message.includes("401") || error.message.includes("unauthorized")) {
          errorMessage = "Invalid API credentials.";
        } else if (error.message.includes("403") || error.message.includes("forbidden")) {
          errorMessage = "Insufficient permissions.";
        } else if (error.message.includes("CORS")) {
          errorMessage = "Cross-origin request blocked.";
        } else if (error.message.includes("Network")) {
          errorMessage = "Network error.";
        } else {
          errorMessage = `${error.message}.`;
        }
      }
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  }, [isAuthenticated, apiKey, apiSecret, warehouses]);

  // Fetch branches
  const fetchBranches = useCallback(async () => {
    if (!isAuthenticated) {
      console.error("Not authenticated. Cannot fetch branches.");
      throw new Error("Authentication required to fetch branches.");
    }

    if (branches.length > 0) {
      console.log("Returning cached branches:", branches);
      return branches;
    }

    const BRANCH_API_URL = `${FRAPPE_BASE_URL}/api/resource/Branch?fields=["name"]&limit_page_length=10000`;

    try {
      const data = await makeFrappeApiCall(BRANCH_API_URL, "Branches", apiKey!, apiSecret!);
      const branchData = data.map((branch: any) => ({
        name: branch.name,
        label: branch.name,
        value: branch.name,
      }));
      console.log("Branches loaded successfully:", branchData);
      setBranches(branchData);
      return branchData;
    } catch (error) {
      let errorMessage = "Error loading branches";
      if (error instanceof Error) {
        if (error.message.includes("401") || error.message.includes("unauthorized")) {
          errorMessage = "Invalid API credentials.";
        } else if (error.message.includes("403") || error.message.includes("forbidden")) {
          errorMessage = "Insufficient permissions.";
        } else if (error.message.includes("CORS")) {
          errorMessage = "Cross-origin request blocked.";
        } else if (error.message.includes("Network")) {
          errorMessage = "Network error.";
        } else {
          errorMessage = `${error.message}.`;
        }
      }
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  }, [isAuthenticated, apiKey, apiSecret, branches]);

  // Fetch kits
  const fetchKits = useCallback(async () => {
    if (!isAuthenticated) {
      console.error("Not authenticated. Cannot fetch kits.");
      throw new Error("Authentication required to fetch kits.");
    }

    if (kits.length > 0) {
      console.log("Returning cached kits:", kits);
      return kits;
    }

    const PRODUCT_BUNDLE_API_URL = `${FRAPPE_BASE_URL}/api/resource/Product Bundle?fields=["name","new_item_code","disabled"]&filters=[["disabled","!=",1]]`;

    try {
      const data = await makeFrappeApiCall(PRODUCT_BUNDLE_API_URL, "Product Bundles", apiKey!, apiSecret!);
      const kitData = data.map((kit: any) => ({
        name: kit.name,
        new_item_code: kit.new_item_code || kit.name,
        label: kit.name,
        value: kit.name,
      }));
      console.log("Kits loaded successfully:", kitData);
      setKits(kitData);
      return kitData;
    } catch (error) {
      let errorMessage = "Error loading kits";
      if (error instanceof Error) {
        if (error.message.includes("401") || error.message.includes("unauthorized")) {
          errorMessage = "Invalid API credentials.";
        } else if (error.message.includes("403") || error.message.includes("forbidden")) {
          errorMessage = "Insufficient permissions.";
        } else if (error.message.includes("CORS")) {
          errorMessage = "Cross-origin request blocked.";
        } else if (error.message.includes("Network")) {
          errorMessage = "Network error.";
        } else {
          errorMessage = `${error.message}.`;
        }
      }
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  }, [isAuthenticated, apiKey, apiSecret, kits]);

  // Fetch classifications
  const fetchClassifications = useCallback(async () => {
    if (!isAuthenticated) {
      console.error("Not authenticated. Cannot fetch classifications.");
      throw new Error("Authentication required to fetch classifications.");
    }

    if (classifications.length > 0) {
      console.log("Returning cached classifications:", classifications);
      return classifications;
    }

    const CLASSIFICATION_API_URL = buildFrappeApiUrl("Classification", ["name"]);

    try {
      const data = await makeFrappeApiCall(CLASSIFICATION_API_URL, "Classifications", apiKey!, apiSecret!);
      const classificationData = data.map((classification: any) => ({
        name: classification.name,
        label: classification.name,
        value: classification.name,
      }));
      console.log("Classifications loaded successfully:", classificationData);
      setClassifications(classificationData);
      return classificationData;
    } catch (error) {
      let errorMessage = "Error loading classifications";
      if (error instanceof Error) {
        if (error.message.includes("401") || error.message.includes("unauthorized")) {
          errorMessage = "Invalid API credentials.";
        } else if (error.message.includes("403") || error.message.includes("forbidden")) {
          errorMessage = "Insufficient permissions.";
        } else if (error.message.includes("CORS")) {
          errorMessage = "Cross-origin request blocked.";
        } else if (error.message.includes("Network")) {
          errorMessage = "Network error.";
        } else {
          errorMessage = `${error.message}.`;
        }
      }
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  }, [isAuthenticated, apiKey, apiSecret, classifications]);

  // Fetch customers
  const fetchCustomer = useCallback(async () => {
    if (!isAuthenticated) {
      console.error("Not authenticated. Cannot fetch Customer.");
      throw new Error("Authentication required to fetch Customer.");
    }

    if (customers.length > 0) {
      console.log("Returning cached customers:", customers);
      return customers;
    }

    const CUSTOMER_API_URL = buildFrappeApiUrl("Customer", ["name"]);

    try {
      const data = await makeFrappeApiCall(CUSTOMER_API_URL, "Customer", apiKey!, apiSecret!);
      const customerData = data.map((customer: any) => ({
        name: customer.name,
        label: customer.name,
        value: customer.name,
      }));
      console.log("Customers loaded successfully:", customerData);
      setCustomers(customerData);
      return customerData;
    } catch (error) {
      let errorMessage = "Error loading customers";
      if (error instanceof Error) {
        if (error.message.includes("401") || error.message.includes("unauthorized")) {
          errorMessage = "Invalid API credentials.";
        } else if (error.message.includes("403") || error.message.includes("forbidden")) {
          errorMessage = "Insufficient permissions.";
        } else if (error.message.includes("CORS")) {
          errorMessage = "Cross-origin request blocked.";
        } else if (error.message.includes("Network")) {
          errorMessage = "Network error.";
        } else {
          errorMessage = `${error.message}.`;
        }
      }
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  }, [isAuthenticated, apiKey, apiSecret, customers]);

  // Fetch companies
  const fetchCompany = useCallback(async () => {
    if (!isAuthenticated) {
      console.error("Not authenticated. Cannot fetch Company.");
      throw new Error("Authentication required to fetch Company.");
    }

    if (companies.length > 0) {
      console.log("Returning cached companies:", companies);
      return companies;
    }

    const COMPANY_API_URL = buildFrappeApiUrl("Company", ["name"]);

    try {
      const data = await makeFrappeApiCall(COMPANY_API_URL, "Company", apiKey!, apiSecret!);
      const companyData = data.map((company: any) => ({
        name: company.name,
        label: company.name,
        value: company.name,
      }));
      console.log("Companies loaded successfully:", companyData);
      setCompanies(companyData);
      return companyData;
    } catch (error) {
      let errorMessage = "Error loading companies";
      if (error instanceof Error) {
        if (error.message.includes("401") || error.message.includes("unauthorized")) {
          errorMessage = "Invalid API credentials.";
        } else if (error.message.includes("403") || error.message.includes("forbidden")) {
          errorMessage = "Insufficient permissions.";
        } else if (error.message.includes("CORS")) {
          errorMessage = "Cross-origin request blocked.";
        } else if (error.message.includes("Network")) {
          errorMessage = "Network error.";
        } else {
          errorMessage = `${error.message}.`;
        }
      }
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  }, [isAuthenticated, apiKey, apiSecret, companies]);

  // Fetch branches (local)
  const fetchBranch = useCallback(async () => {
    if (!isAuthenticated) {
      console.error("Not authenticated. Cannot fetch Branch.");
      throw new Error("Authentication required to fetch Branch.");
    }

    if (localBranches.length > 0) {
      console.log("Returning cached branches:", localBranches);
      return localBranches;
    }

    const BRANCH_API_URL = buildFrappeApiUrl("Branch", ["name"]);

    try {
      const data = await makeFrappeApiCall(BRANCH_API_URL, "Branch", apiKey!, apiSecret!);
      const branchData = data.map((branch: any) => ({
        name: branch.name,
        label: branch.name,
        value: branch.name,
      }));
      console.log("Branches loaded successfully:", branchData);
      setLocalBranches(branchData);
      return branchData;
    } catch (error) {
      let errorMessage = "Error loading branches";
      if (error instanceof Error) {
        if (error.message.includes("401") || error.message.includes("unauthorized")) {
          errorMessage = "Invalid API credentials.";
        } else if (error.message.includes("403") || error.message.includes("forbidden")) {
          errorMessage = "Insufficient permissions.";
        } else if (error.message.includes("CORS")) {
          errorMessage = "Cross-origin request blocked.";
        } else if (error.message.includes("Network")) {
          errorMessage = "Network error.";
        } else {
          errorMessage = `${error.message}.`;
        }
      }
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  }, [isAuthenticated, apiKey, apiSecret, localBranches]);

  // Fetch departments
  const fetchDepartment = useCallback(async () => {
    if (!isAuthenticated) {
      console.error("Not authenticated. Cannot fetch departments.");
      throw new Error("Authentication required to fetch departments.");
    }

    if (departments.length > 0) {
      console.log("Returning cached departments:", departments);
      return departments;
    }

    const DEPARTMENT_API_URL = `${FRAPPE_BASE_URL}/api/resource/Department?fields=["name"]&limit_page_length=10000`;

    try {
      const data = await makeFrappeApiCall(DEPARTMENT_API_URL, "Departments", apiKey!, apiSecret!);
      const departmentData = data.map((department: any) => ({
        name: department.name,
        department_name: department.name,
        label: department.name,
        value: department.name,
      }));
      console.log("Departments loaded successfully:", departmentData);
      setDepartments(departmentData);
      return departmentData;
    } catch (error) {
      let errorMessage = "Error loading departments";
      if (error instanceof Error) {
        if (error.message.includes("401") || error.message.includes("unauthorized")) {
          errorMessage = "Invalid API credentials.";
        } else if (error.message.includes("403") || error.message.includes("forbidden")) {
          errorMessage = "Insufficient permissions.";
        } else if (error.message.includes("CORS")) {
          errorMessage = "Cross-origin request blocked.";
        } else if (error.message.includes("Network")) {
          errorMessage = "Network error.";
        } else {
          errorMessage = `${error.message}.`;
        }
      }
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  }, [isAuthenticated, apiKey, apiSecret, departments]);

  // Fetch sub-departments
  const fetchSubDepatment = useCallback(async () => {
    if (!isAuthenticated) {
      console.error("Not authenticated. Cannot fetch SubDepartment.");
      throw new Error("Authentication required to fetch Department.");
    }

    if (subDepartments.length > 0) {
      console.log("Returning cached sub-departments:", subDepartments);
      return subDepartments;
    }

    const SUB_DEPARTMENT_API_URL = buildFrappeApiUrl("Department", ["name"]);

    try {
      const data = await makeFrappeApiCall(SUB_DEPARTMENT_API_URL, "Sub Department", apiKey!, apiSecret!);
      const subdepartmentData = data.map((subDepartment: any) => ({
        name: subDepartment.name,
        label: subDepartment.name,
        value: subDepartment.name,
      }));
      console.log("Sub-departments loaded successfully:", subdepartmentData);
      setSubDepartments(subdepartmentData);
      return subdepartmentData;
    } catch (error) {
      let errorMessage = "Error loading sub-departments";
      if (error instanceof Error) {
        if (error.message.includes("401") || error.message.includes("unauthorized")) {
          errorMessage = "Invalid API credentials.";
        } else if (error.message.includes("403") || error.message.includes("forbidden")) {
          errorMessage = "Insufficient permissions.";
        } else if (error.message.includes("CORS")) {
          errorMessage = "Cross-origin request blocked.";
        } else if (error.message.includes("Network")) {
          errorMessage = "Network error.";
        } else {
          errorMessage = `${error.message}.`;
        }
      }
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  }, [isAuthenticated, apiKey, apiSecret, subDepartments]);

  // Fetch user default company
  const fetchUserDefaultCompany = useCallback(async () => {
    if (!isAuthenticated) {
      console.error("Not authenticated. Cannot fetch user default company.");
      throw new Error("Authentication required to fetch user default company.");
    }

    const url = `${FRAPPE_BASE_URL}/api/method/quantbit_hims_integration.api.pos_api.get_user_default_company`;

    try {
      console.log("Fetching user default company...");
      const authHeader = `token ${apiKey}:${apiSecret}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.message || null;
    } catch (error) {
      console.error('Error fetching user default company:', error);
      return null;
    }
  }, [isAuthenticated, apiKey, apiSecret]);

  // Fetch warehouse for sub-department
  const fetchWarehouseForSubdepartment = useCallback(async (subDepartment: string) => {
    if (!isAuthenticated) {
      console.error("Not authenticated. Cannot fetch warehouse for sub-department.");
      throw new Error("Authentication required to fetch warehouse for sub-department.");
    }

    const url = `${FRAPPE_BASE_URL}/api/method/quantbit_hims_integration.quantbit_hims_integration.api.get_warehouse_for_subdepartment`;

    try {
      console.log(`Fetching warehouse for sub-department: ${subDepartment}...`);
      const authHeader = `token ${apiKey}:${apiSecret}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        credentials: 'include',
        body: JSON.stringify({ sub_department: subDepartment }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.message?.warehouse || null;
    } catch (error) {
      console.error(`Error fetching warehouse for sub-department ${subDepartment}:`, error);
      return null;
    }
  }, [isAuthenticated, apiKey, apiSecret]);

  // Fetch doctors
  const fetchDoctors = useCallback(async (branch: string) => {
    if (!isAuthenticated) {
      console.error("Not authenticated. Cannot fetch doctors.");
      throw new Error("Authentication required to fetch doctors.");
    }

    if (!branch) {
      console.warn("Branch not selected. Cannot fetch doctors.");
      setDoctors([]);
      return [];
    }

    const url = `${FRAPPE_BASE_URL}/api/method/quantbit_hims_integration.quantbit_hims_integration.doctor_api.get_doctor_list`;

    try {
      console.log(`Fetching doctors for branch: ${branch}...`);
      const authHeader = `token ${apiKey}:${apiSecret}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        credentials: 'include',
        body: JSON.stringify({ branch: branch }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const doctorData = data.message.data.items.map((doctor: any) => ({
        name: doctor.value,
        label: doctor.value,
        value: doctor.key, // Assuming 'name' is the unique identifier for the doctor
      }));
      console.log("Doctors loaded successfully:", doctorData);
      setDoctors(doctorData);
      return doctorData;
    } catch (error) {
      console.error(`Error fetching doctors for branch ${branch}:`, error);
      setDoctors([]);
      return [];
    }
  }, [isAuthenticated, apiKey, apiSecret]);

  // Automatically fetch data on mount if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchWarehouses();
      fetchBranches();
      fetchKits();
      fetchClassifications();
      fetchCustomer();
      fetchBranch();
      fetchCompany();
      fetchDepartment();
      fetchSubDepatment();
    }
  }, [isAuthenticated, fetchWarehouses, fetchBranches, fetchKits, fetchClassifications, fetchCustomer, fetchCompany, fetchBranch, fetchDepartment, fetchSubDepatment]);

  return {
    fetchWarehouses,
    fetchBranches,
    fetchKits,
    fetchClassifications,
    fetchCustomer,
    fetchCompany,
    fetchBranch,
    fetchDepartment,
    fetchSubDepatment,
    fetchUserDefaultCompany,
    fetchWarehouseForSubdepartment,
    fetchDoctors,
    buildFrappeApiUrl,
    warehouses,
    branches,
    kits,
    classifications,
    companies,
    customers,
    localBranches,
    departments,
    subDepartments,
    doctors
  };
};