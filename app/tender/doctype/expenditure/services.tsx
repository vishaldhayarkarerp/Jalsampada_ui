import axios from 'axios';

const API_BASE_URL = "http://103.219.3.169:2223/api/resource";

/**
 * Service functions for Expenditure operations
 */

export interface WorkNameResponse {
    work_name: string;
}

/**
 * Fetches work name for a given tender number using SQL query
 * @param tenderNumber - The tender/project number
 * @param apiKey - Frappe API key
 * @param apiSecret - Frappe API secret
 * @returns Promise resolving to work name or null
 */
export async function fetchWorkNameByTenderNumber(
    tenderNumber: string,
    apiKey: string,
    apiSecret: string
): Promise<string | null> {
    try {
        const sqlQuery = `SELECT DISTINCT ps.work_name FROM \`tabProject\` p JOIN \`tabPrapan Suchi\` ps ON p.custom_prapan_suchi = ps.name WHERE p.name = '${tenderNumber}'`;

        const response = await axios.post(
            `${API_BASE_URL.replace("/api/resource", "")}/api/method/quantlis_management.api.frappe_db_sql`,
            { sql_query: sqlQuery },
            {
                headers: {
                    Authorization: `token ${apiKey}:${apiSecret}`,
                    "Content-Type": "application/json",
                },
                withCredentials: true,
            }
        );

        if (response.data?.message && response.data.message.length > 0) {
            return response.data.message[0].work_name;
        }

        return null;
    } catch (error) {
        console.error("Failed to fetch work name:", error);
        throw error;
    }
}

/**
 * Updates work name in all rows of expenditure details table
 * @param formInstance - React Hook Form instance
 * @param workName - The work name to set in all rows
 */
export function updateWorkNameInTableRows(
    formInstance: any,
    workName: string
): void {
    try {
        const currentRows = formInstance.getValues("expenditure_details") || [];

        if (currentRows.length > 0) {
            const updatedRows = currentRows.map((row: any) => ({
                ...row,
                name_of_work: workName
            }));
            formInstance.setValue("expenditure_details", updatedRows, { shouldDirty: true });
        } else {
            // If no rows exist, create first one with work name
            formInstance.setValue("expenditure_details", [{ name_of_work: workName }]);
        }
    } catch (error) {
        console.error("Failed to update work name in table rows:", error);
        throw error;
    }
}

/**
 * Clears work name from all rows in expenditure details table
 * @param formInstance - React Hook Form instance
 */
export function clearWorkNameInTableRows(formInstance: any): void {
    try {
        const currentRows = formInstance.getValues("expenditure_details") || [];

        if (currentRows.length > 0) {
            const updatedRows = currentRows.map((row: any) => ({
                ...row,
                name_of_work: ""
            }));
            formInstance.setValue("expenditure_details", updatedRows, { shouldDirty: true });
        }
    } catch (error) {
        console.error("Failed to clear work name in table rows:", error);
        throw error;
    }
}