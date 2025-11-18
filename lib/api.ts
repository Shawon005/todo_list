const API_BASE_URL = "https://todo-app.pioneeralpha.com/api";

// Token management
export const TOKEN_KEY = "dreamy-todo-token";
export const USER_KEY = "dreamy-todo-user";

export function getToken(): string | null {
  // if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}



export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
}

export function setUser(user: User): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));

  // Notify any listeners (e.g. sidebar layout) that the user has been updated
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("user-updated"));
  }
}

// API request helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    // Use type assertion to allow dynamic Authorization header setting
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle unauthorized (401) - token expired or invalid
  if (response.status === 401) {
    removeToken();
    if (typeof window !== "undefined") {
      // window.location.href = "/login";
    }
    throw new Error("Session expired. Please login again.");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: response.statusText || "An error occurred",
    }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// API request helper for FormData (file uploads)
async function apiRequestFormData<T>(
  endpoint: string,
  formData: FormData,
  method: string = "PATCH"
): Promise<T> {
  const token = getToken();
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: HeadersInit = {};

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: formData,
  });

  // Handle unauthorized (401) - token expired or invalid
  if (response.status === 401) {
    removeToken();
    if (typeof window !== "undefined") {
      // window.location.href = "/login";
    }
    throw new Error("Session expired. Please login again.");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: response.statusText || "An error occurred",
    }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Auth API
export interface SignupRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  access:string;
  refresh:string;

}
export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  address:string;
  contact_number: string;
  birthday: string;
  profile_image: string;
  bio:string;
}

export const authApi = {
  signup: async (data: SignupRequest): Promise<AuthResponse> => {
    const response = await apiRequest<AuthResponse>("/users/signup/", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (response.token) {
      setToken(response.token);
    }
    return response;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiRequest<AuthResponse>("/auth/login/", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (response.access) {
      setToken(response.access);
      if (response) {
        const responses = await apiRequest<User>("/users/me/", {
          method: "GET",
        });
        setUser(responses);
      }
    }
    return response;
  },
};

// Todo API
export interface TodoItem {
  id: number;
  title: string;
  description: string;
  priority: string;
  is_completed: boolean;
  position: number;
  todo_date: string;
  created_at: string;
  updated_at: string;
}

export interface TodoListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: TodoItem[];
}

export interface CreateTodoRequest {
  title: string;
  description: string;
  todo_date: string;
  priority: "extreme" | "moderate" | "low";
}

export interface UpdateTodoRequest extends CreateTodoRequest {
  id: number;
}

export const todoApi = {
  getAll: async (): Promise<TodoItem[]> => {
    const response = await apiRequest<TodoListResponse>("/todos/");
    return response.results;
  },

  getById: async (id: string): Promise<TodoItem> => {
    return apiRequest<TodoItem>(`/todos/?search=${id}`);
  },

  create: async (data: CreateTodoRequest): Promise<TodoItem> => {

    return apiRequest<TodoItem>("/todos/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: CreateTodoRequest): Promise<TodoItem> => {
    return apiRequest<TodoItem>(`/todos/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: any): Promise<void> => {
    return apiRequest<void>(`/todos/${id}/`, {
      method: "DELETE",
    });
  },

  // Reorder todos by updating their position field
  reorder: async (items: { id: number; position: number }[]): Promise<void> => {
    await Promise.all(
      items.map((item) =>
        apiRequest<TodoItem>(`/todos/${item.id}/`, {
          method: "PATCH",
          body: JSON.stringify({ position: item.position }),
        }),
      ),
    );
  },
};

// Profile API
export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  address?: string;
  contact_number?: string;
  birthday?: string;
  bio?: string;
  profile_image?: File;
}

export const profileApi = {
  get: async (): Promise<User> => {
    const response = await apiRequest<User>("/users/me/", {
      method: "GET",
    });
    setUser(response);
    return response;
  },

  update: async (data: UpdateProfileRequest): Promise<User> => {
    const formData = new FormData();

    // Add text fields
    if (data.first_name) formData.append("first_name", data.first_name);
    if (data.last_name) formData.append("last_name", data.last_name);
    if (data.email) formData.append("email", data.email);
    if (data.address) formData.append("address", data.address);
    if (data.contact_number) formData.append("contact_number", data.contact_number);
    if (data.birthday) formData.append("birthday", data.birthday);
    if (data.bio) formData.append("bio", data.bio);

    // Add image file if provided
    if (data.profile_image) {
      formData.append("profile_image", data.profile_image);
    }

    const response = await apiRequestFormData<User>("/users/me/", formData, "PATCH");
    setUser(response);
    return response;
  },
};

