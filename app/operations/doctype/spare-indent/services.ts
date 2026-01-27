import axios from "axios";

const API_BASE_URL = "http://103.219.1.138:4412";

export interface FetchAssetsFromLisAndStageParams {
    custom_lis_name: string;
    custom_stage: string;
    custom_asset_category: string;
}

export interface FetchAssetsFromLisAndStageResponse {
    message: string[];
}

export async function fetchAssetsFromLisAndStage(
    params: FetchAssetsFromLisAndStageParams,
    apiKey: string,
    apiSecret: string
): Promise<string[]> {
    try {
        const response = await axios.post<FetchAssetsFromLisAndStageResponse>(
            `${API_BASE_URL}/api/method/quantlis_management.quantlis_utils.fetch_assets_from_lis_and_stage`,
            params,
            {
                headers: { Authorization: `token ${apiKey}:${apiSecret}` },
            }
        );

        return Array.isArray(response.data?.message) ? response.data.message : [];
    } catch (error) {
        console.error("Failed to fetch assets:", error);
        throw error;
    }
}