// api/rpc.ts
import axios from "axios";

export async function bulkDeleteRPC(
  doctype: string,
  ids: string[],
  baseUrl: string,
  apiKey: string,
  apiSecret: string
) {
  // Frappe RPC endpoint for deleting items
  const url = `${baseUrl}/api/method/frappe.desk.reportview.delete_items`;

  // Payload must be Form Data with "items" as a stringified array
  const params = new URLSearchParams();
  params.append("items", JSON.stringify(ids));
  params.append("doctype", doctype);

  const response = await axios.post(url, params, {
    headers: {
      Authorization: `token ${apiKey}:${apiSecret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    withCredentials: true,
  });

  return response.data;
}