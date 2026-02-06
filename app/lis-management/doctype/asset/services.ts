import axios from 'axios';

const FRAPPE_BASE_URL = "http://103.219.1.138:4412";

export interface LogsheetData {
    name: string;
    water_level: number;
    pressure_guage: number;
    br: number;
    ry: number;
    yb: number;
    r: number;
    y: number;
    b: number;
    date: string;
    time: string;
}

export const fetchLogsheetData = async (
    lisName: string,
    stageNo: string,
    assetName: string,
    apiKey: string,
    apiSecret: string
): Promise<LogsheetData[]> => {
    try {
        const response = await axios.get(
            `${FRAPPE_BASE_URL}/api/method/quantlis_management.api.get_logsheet_data`,
            {
                params: {
                    lis: lisName,
                    stage: stageNo,
                    asset: assetName
                },
                headers: { Authorization: `token ${apiKey}:${apiSecret}` }
            }
        );
        return response.data.message || [];
    } catch (err) {
        console.error('Failed to fetch logsheet data:', err);
        throw new Error('Failed to load logsheet data');
    }
};