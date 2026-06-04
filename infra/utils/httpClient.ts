import fetch from 'node-fetch';

export const getRequest = async (url: string): Promise<any> => {
  console.log(`Making GET request to: ${url}`);
  const headers = getAuthHeaders();
  try {
    const response = await fetch(url, { headers });
    return await response.json();
  } catch (error) {
    console.error(`Error fetching GET request from ${url}:`, error);
    throw error;
  }
};

const getAuthHeaders = () => {
  // Simulate fetching an API token from environment variables or a secure vault
  const apiToken = process.env.FOOTBALL_DATA_API_TOKEN;
  if (!apiToken) {
    console.warn("FOOTBALL_DATA_API_TOKEN is not set. Requests may fail.");
    throw new Error("API token is required for authentication");
  }
  return {
    'X-Auth-Token': apiToken,
    'Content-Type': 'application/json',
  };
};