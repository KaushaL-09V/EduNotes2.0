// src/lib/apiClient.js

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const apiRequest = async (endpoint, options = {}) => {
  const { method = "GET", body, token, headers = {} } = options;
  const authToken = token !== undefined ? token : localStorage.getItem("token");

  const config = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (authToken) config.headers["Authorization"] = `Bearer ${authToken}`;
  if (body && ["POST", "PUT", "PATCH"].includes(method.toUpperCase())) {
    config.body = JSON.stringify(body);
  }

  const fullUrl = `${API_BASE_URL}${endpoint}`;
  console.log(`[apiRequest] ${method} ${fullUrl}`, { headers: config.headers, body });

  try {
    const response = await fetch(fullUrl, config);

    // Try to parse JSON, but handle non-JSON gracefully
    let data;
    const text = await response.text().catch(() => null);
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    if (!response.ok) {
      const errorMessage = data?.message || data?.error || `Request failed with status ${response.status}`;
      if (response.status === 401) {
        localStorage.removeItem("token");
        window.dispatchEvent(new Event("unauthorized"));
      }
      console.error("[apiRequest] non-OK", response.status, errorMessage, data);
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    // fetch threw (network error)
    console.error("[apiRequest] Network/Fetch error:", error);
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Network error. Please check your connection and try again.");
    }
    throw error;
  }
};

/**
 * Helper function for GET requests
 */
export const apiGet = (endpoint, options = {}) => {
  return apiRequest(endpoint, { ...options, method: "GET" });
};

/**
 * Helper function for POST requests
 */
export const apiPost = (endpoint, body, options = {}) => {
  return apiRequest(endpoint, { ...options, method: "POST", body });
};

/**
 * Helper function for PUT requests
 */
export const apiPut = (endpoint, body, options = {}) => {
  return apiRequest(endpoint, { ...options, method: "PUT", body });
};

/**
 * Helper function for DELETE requests
 */
export const apiDelete = (endpoint, options = {}) => {
  return apiRequest(endpoint, { ...options, method: "DELETE" });
};
export const downloadFile = async (path, filename) => {
    const authToken = localStorage.getItem("token");
    const response = await fetch(buildUrl(path), {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
    });

    if (!response.ok) {
        const message = `Failed to download file (${response.status})`;
        throw new Error(message);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};
export default {
  apiRequest,
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
    downloadFile,
};