import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000'; // Backend URL

// Interface for the response of the chat/query endpoint
export interface ChatResponse {
  answer: string;
  sources: any[]; // Define more specific type if sources structure is known
}

// Interface for upload response
export interface UploadResponse {
  filename: string;
  message: string;
}

// Interface for delete response
export interface DeleteResponse {
  status: string;
  message: string;
}

/**
 * Uploads a document to the backend.
 * @param file The file to upload.
 * @param userId The ID of the user uploading the file.
 * @returns Promise resolving to UploadResponse
 */
export const uploadDocument = async (file: File, userId: string): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('user_id', userId);

  try {
    const response = await axios.post<UploadResponse>(`${API_BASE_URL}/upload/upload/`, formData, {
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
 * Deletes a document from the backend.
 * @param filename The name of the file to delete.
 * @param userId The ID of the user who owns the file.
 * @returns Promise resolving to DeleteResponse
 */
export const deleteDocument = async (filename: string, userId: string): Promise<DeleteResponse> => {
  const formData = new FormData();
  formData.append('filename', filename);
  formData.append('user_id', userId);

  try {
    const response = await axios.post<DeleteResponse>(`${API_BASE_URL}/delete/`, formData);
    return response.data;
  } catch (error) {
    console.error('Error deleting document:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.detail || 'Failed to delete document');
    }
    throw new Error('Failed to delete document');
  }
};

/**
 * Sends a query to the backend and gets a response.
 * @param question The question to ask.
 * @param userId The ID of the user asking the question.
 * @returns Promise resolving to ChatResponse
 */
export const queryDocuments = async (question: string, userId: string): Promise<ChatResponse> => {
  try {
    const response = await axios.post<ChatResponse>(`${API_BASE_URL}/chat/`, {
      question,
      user_id: userId,
    });
    return response.data;
  } catch (error) {
    console.error('Error querying documents:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.detail || 'Failed to query documents');
    }
    throw new Error('Failed to query documents');
  }
};
