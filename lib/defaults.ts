import { TodoItem, UserProfile } from "@/types";

export const defaultUserProfile: UserProfile = {
  firstName: "Amanuel",
  lastName: "Tekle",
  email: "amanuel@gmail.com",
  password: "demo1234",
  address: "123 Dreamy Software Ave.",
  contactNumber: "+1 (555) 010-2030",
  birthday: "1995-07-11",
  avatar: "",
};

export const sampleTodos: TodoItem[] = [
  {
    id: 1,
    title: "Backend Infrastructure",
    description: "Upgrading backend infrastructure for better performance",
    priority: "Extreme",
    is_completed: false,
    position: 1,
    todo_date: "2025-04-15",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    title: "Mobile App Redesign",
    description:
      "Redesigning the mobile app interface for better user experience",
    priority: "Moderate",
    is_completed: false,
    position: 2,
    todo_date: "2025-03-25",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    title: "Analytics Dashboard",
    description: "Creating a new analytics dashboard for clients",
    priority: "Low",
    is_completed: false,
    position: 3,
    todo_date: "2025-03-30",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

