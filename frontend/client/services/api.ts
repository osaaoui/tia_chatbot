import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000'; // Ensure this matches your backend URL

// --- Upload Endpoint Response (matches Pydantic UploadResponse) ---
export interface ApiUploadResponse {
  filename: string;
  message: string;
  user_id: string;
  total_chunks_processed: number;
  table_chunks_extracted: number;
  text_sections_extracted: number;
}

// --- Delete Endpoint Request & Response (matches Pydantic DeleteRequest, FileDeleteStatus, DeleteResponse) ---
export interface ApiDeleteRequestData {
  user_id: string;
  filenames: string[];
}

export interface ApiFileDeleteStatus {
  filename: string;
  status: string;
  message?: string | null;
}

export interface ApiDeleteResponseData {
  user_id: string;
  overall_message: string;
  files_status: ApiFileDeleteStatus[];
}

// --- Query Endpoint Request & Response (matches Pydantic QueryRequest, SourceDocument, QueryResponse) ---
export interface ApiQueryRequestData {
  user_id: string;
  question: string;
  top_k?: number; // Optional, as Pydantic model has a default
}

export interface ApiSourceDocumentData {
  filename: string;
  page?: number | null;
  content_type?: string | null;
  section_title?: string | null;
  table_page?: number | null;
  preview?: string | null;
}

export interface ApiQueryResponseData {
  question: string;
  answer: string;
  sources: ApiSourceDocumentData[];
  user_id: string;
}

// --- Auth Endpoint Interfaces (matching Pydantic UserBase, UserCreateRequest, UserResponse, LoginRequest) ---
export interface UserBase {
  username: string;
  full_name?: string | null;
}

export interface UserCreateRequest extends UserBase {
  password: string;
  role: string; // "admin" or "reader"
}

export interface UserResponse extends UserBase {
  id: string; // Typically the username
  role: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

// Token model (placeholder, not used if login returns UserResponse directly)
// export interface Token {
//   access_token: string;
//   token_type: string;
// }


/**
 * Uploads a document to the backend.
 * @param file The file to upload.
 * @param userId The ID of the user uploading the file.
 * @returns Promise resolving to ApiUploadResponse
 */
export const uploadDocument = async (file: File, userId: string): Promise<ApiUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('user_id', userId); // Backend expects user_id as Form data

  try {
    // Path updated to /api/v2/documents/upload/
    const response = await axios.post<ApiUploadResponse>(`${API_BASE_URL}/api/v2/documents/upload/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading document:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.detail || 'Failed to upload document');
    }
    throw new Error('Failed to upload document');
  }
};

/**
 * Deletes one or more documents from the backend.
 * @param data The data for the delete request, including user_id and list of filenames.
 * @returns Promise resolving to ApiDeleteResponseData
 */
export const deleteDocuments = async (data: ApiDeleteRequestData): Promise<ApiDeleteResponseData> => {
  try {
    // Path updated to /api/v2/documents/delete/
    // Data sent as JSON body
    const response = await axios.post<ApiDeleteResponseData>(`${API_BASE_URL}/api/v2/documents/delete/`, data);
    return response.data;
  } catch (error) {
    console.error('Error deleting documents:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.detail || 'Failed to delete documents');
    }
    throw new Error('Failed to delete documents');
  }
};

/**
 * Sends a query to the backend and gets a response.
 * @param data The data for the query request, including user_id, question, and optional top_k.
 * @returns Promise resolving to ApiQueryResponseData
 */
export const queryDocuments = async (data: ApiQueryRequestData): Promise<ApiQueryResponseData> => {
  try {
    // Path updated to /api/v2/query/
    // Data sent as JSON body
    const response = await axios.post<ApiQueryResponseData>(`${API_BASE_URL}/api/v2/query/`, data);
    return response.data;
  } catch (error) {
    console.error('Error querying documents:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.detail || 'Failed to query documents');
    }
    throw new Error('Failed to query documents');
  }
};

// --- Authentication Service Calls ---

/**
 * Registers a new user.
 * @param data User creation data including username, password, full_name, and role.
 * @returns Promise resolving to UserResponse.
 */
export const signupUser = async (data: UserCreateRequest): Promise<UserResponse> => {
  try {
    const response = await axios.post<UserResponse>(`${API_BASE_URL}/api/v2/auth/signup`, data);
    return response.data;
  } catch (error) {
    console.error('Error during user signup:', error);
    if (axios.isAxiosError(error) && error.response) {
      // Backend might return specific error messages in error.response.data.detail
      throw new Error(error.response.data.detail || 'Signup failed');
    }
    throw new Error('Signup failed due to an unexpected error');
  }
};

/**
 * Logs in an existing user.
 * @param data User login credentials (username and password).
 * @returns Promise resolving to UserResponse.
 */
export const loginUser = async (data: LoginRequest): Promise<UserResponse> => {
  try {
    const response = await axios.post<UserResponse>(`${API_BASE_URL}/api/v2/auth/login`, data);
    return response.data;
  } catch (error) {
    console.error('Error during user login:', error);
    if (axios.isAxiosError(error) && error.response) {
      // Backend might return specific error messages in error.response.data.detail
      throw new Error(error.response.data.detail || 'Login failed');
    }
    throw new Error('Login failed due to an unexpected error');
  }
};
