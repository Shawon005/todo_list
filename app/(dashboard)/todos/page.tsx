"use client";

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CSSProperties, FormEvent, useEffect, useMemo, useState } from "react";
import { todoApi, TodoItem } from "@/lib/api";
import { PriorityLevel } from "@/types";

interface DraftTodo {
  id?: number;
  title: string;
  description: string;
  todo_date: string;
  priority: PriorityLevel;
}

const emptyDraft: DraftTodo = {
  title: "",
  description: "",
  todo_date: "",
  priority: "moderate",
};


export default function TodosPage() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<PriorityLevel | "all">(
    "all",
  );
  const [sortBy, setSortBy] = useState<"custom" | "date-asc" | "date-desc">(
    "custom",
  );
  const [draft, setDraft] = useState<DraftTodo>(emptyDraft);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  // Load todos from API on mount
  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await todoApi.getAll();
      setTodos(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load todos. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTodos = useMemo(() => {
    let next = [...todos];
    if (priorityFilter !== "all") {
      next = next.filter((todo) => todo.priority === priorityFilter);
    }
    if (search.trim()) {
      const query = search.toLowerCase();
      next = next.filter(
        (todo) =>
          todo.title.toLowerCase().includes(query) ||
          todo.description.toLowerCase().includes(query),
      );
    }
    if (sortBy === "date-asc") {
      next.sort(
        (a, b) =>
          new Date(a.todo_date).getTime() - new Date(b.todo_date).getTime(),
      );
    } else if (sortBy === "date-desc") {
      next.sort(
        (a, b) =>
          new Date(b.todo_date).getTime() - new Date(a.todo_date).getTime(),
      );
    } else {
      // Custom order (position-based)
      next.sort((a, b) => a.position - b.position);
    }
    return next;
  }, [todos, search, priorityFilter, sortBy]);

  const openModal = (todo?: TodoItem) => {
    if (todo) {
      setDraft({
        id: todo.id,
        title: todo.title,
        description: todo.description,
        todo_date: todo.todo_date,
        priority: todo.priority as PriorityLevel,
      });
    } else {
      setDraft(emptyDraft);
    }
    setError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setDraft(emptyDraft);
    setError("");
  };

  const handleSaveTodo = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!draft.todo_date) {
      setError("Please provide a due date.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const todoData = {
        title: draft.title.trim(),
        description: draft.description.trim(),
        todo_date: draft.todo_date,
        priority: draft.priority,
      };

      if (draft.id) {
        // Update existing todo
        const updatedTodo = await todoApi.update(draft.id.toString(), todoData);
        setTodos((prev) =>
          prev.map((todo) => (todo.id === draft.id ? updatedTodo : todo))
        );
      } else {
        // Create new todo
        const newTodo = await todoApi.create(todoData);
        setTodos((prev) => [newTodo, ...prev]);
      }

      closeModal();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to save todo. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this todo?")) {
      return;
    }

    try {
      

      setTodos((prev) => prev.filter((todo) => todo.id !== id));
      const deletes= await todoApi.delete(id);
    } catch (error) {
      // setError(
      //   error instanceof Error
      //     ? error.message
      //     : "Failed to delete todo. Please try again."
      // );
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    if (
      sortBy !== "custom" ||
      priorityFilter !== "all" ||
      Boolean(search.trim())
    ) {
      setError(
        "Reordering is only available in the default view (no filters or alternate sorts).",
      );
      return;
    }

    let reordered: TodoItem[] | undefined;
    setTodos((prev) => {
      const ordered = [...prev].sort((a, b) => a.position - b.position);
      const oldIndex = ordered.findIndex((todo) => todo.id === Number(active.id));
      const newIndex = ordered.findIndex((todo) => todo.id === Number(over.id));
      if (oldIndex === -1 || newIndex === -1) {
        return prev;
      }
      const nextOrder = arrayMove(ordered, oldIndex, newIndex).map((todo, index) => ({
        ...todo,
        position: index + 1,
      }));
      reordered = nextOrder;
      return nextOrder;
    });

    if (!reordered) return;

    setIsReordering(true);
    try {
      await todoApi.reorder(
        reordered.map((todo) => ({ id: todo.id, position: todo.position })),
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to save new order. Please try again.",
      );
    } finally {
      setIsReordering(false);
    }
  };

  const priorityColors: Record<PriorityLevel, string> = {
    extreme: "bg-red-50 text-red-600 border-red-200",
    moderate: "bg-green-50 text-green-600 border-green-200",
    low: "bg-yellow-50 text-yellow-600 border-yellow-200",
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm text-[#5b6c94]">Dreamy Software</p>
          <h1 className="text-3xl font-semibold text-[#0a1b3f]">Todos</h1>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 rounded-2xl bg-[#5570ff] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#4051d7]"
        >
          + New Task
        </button>
      </div>

      {error && todos.length > 0 && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="flex flex-1 items-center gap-3 rounded-2xl border border-[#dde3f5] bg-white px-4 py-3">
          <span className="text-[#9aa7d6]">🔍</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search your task here..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        <div className="flex gap-3">
          <select
            value={priorityFilter}
            onChange={(event) =>
              setPriorityFilter(event.target.value as PriorityLevel | "all")
            }
            className="rounded-2xl border border-[#dde3f5] bg-white px-4 py-3 text-sm outline-none"
          >
            <option value="all">Filter by priority</option>
            <option value="extreme">Extreme</option>
            <option value="moderate">Moderate</option>
            <option value="low">Low</option>
          </select>
          <select
            value={sortBy}
            onChange={(event) =>
              setSortBy(event.target.value as "custom" | "date-asc" | "date-desc")
            }
            className="rounded-2xl border border-[#dde3f5] bg-white px-4 py-3 text-sm outline-none"
          >
            <option value="custom">Manual order</option>
            <option value="date-asc">Sort by (nearest first)</option>
            <option value="date-desc">Sort by (latest first)</option>
          </select>
        </div>
      </div>
      {isReordering && (
        <div className="rounded-xl bg-[#eef1ff] px-4 py-2 text-sm text-[#5570ff]">
          Saving new order...
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#cdd6f6] bg-white px-6 py-16 text-center">
          <div className="rounded-full bg-[#eef1ff] px-6 py-4 text-[#5570ff]">
            Loading todos...
          </div>
        </div>
      ) : error && todos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#cdd6f6] bg-white px-6 py-16 text-center">
          <div className="rounded-full bg-red-50 px-6 py-4 text-red-600">
            Error
          </div>
          <p className="mt-4 text-base text-[#5b6c94]">{error}</p>
          <button
            onClick={loadTodos}
            className="mt-6 rounded-2xl bg-[#5570ff] px-6 py-3 text-sm font-semibold text-white hover:bg-[#4051d7]"
          >
            Retry
          </button>
        </div>
      ) : filteredTodos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#cdd6f6] bg-white px-6 py-16 text-center">
          <div className="rounded-full  px-6 py-4 text-[#5570ff]" onClick={() => openModal()}>
           <img src="no_todo.png" alt="" />
          </div>
          <p className="text-lg">No todos yet</p>
          
        </div>
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext
            items={filteredTodos.map((todo) => todo.id.toString())}
            strategy={rectSortingStrategy}
          >
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {filteredTodos.map((todo) => (
                <SortableTodoCard
                  key={todo.id}
                  todo={todo}
                  priorityColors={priorityColors}
                  onEdit={() => openModal(todo)}
                  onDelete={() => handleDelete(todo.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-[#0a1b3f]">
                {draft.id ? "Update Task" : "Add New Task"}
              </h2>
              <button
                onClick={closeModal}
                className="text-sm font-semibold text-[#5b6c94]"
              >
                Go Back
              </button>
            </div>

            <form className="space-y-5" onSubmit={handleSaveTodo}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1b3f]" htmlFor="title">
                  Title
                </label>
                <input
                  id="title"
                  value={draft.title}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, title: event.target.value }))
                  }
                  className="w-full rounded-xl border border-[#dde3f5] px-4 py-3 text-sm outline-none focus:border-[#5570ff]"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1b3f]" htmlFor="date">
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  value={draft.todo_date}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, todo_date: event.target.value }))
                  }
                  className="w-full rounded-xl border border-[#dde3f5] px-4 py-3 text-sm outline-none focus:border-[#5570ff]"
                  required
                />
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-[#0a1b3f]">Priority</p>
                <div className="flex flex-wrap gap-4">
                  {(["extreme", "moderate", "low"] as PriorityLevel[]).map(
                    (priority) => (
                      <label
                        key={priority}
                        className={`flex cursor-pointer items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium ${
                          draft.priority === priority
                            ? "border-[#5570ff] text-[#5570ff]"
                            : "border-[#dde3f5] text-[#5b6c94]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="priority"
                          value={priority}
                          checked={draft.priority === priority}
                          onChange={() =>
                            setDraft((prev) => ({ ...prev, priority }))
                          }
                          className="hidden"
                        />
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            priority === "extreme"
                              ? "bg-red-500"
                              : priority === "moderate"
                                ? "bg-green-500"
                                : "bg-yellow-500"
                          }`}
                        />
                        {priority}
                      </label>
                    ),
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-[#0a1b3f]"
                  htmlFor="description"
                >
                  Task Description
                </label>
                <textarea
                  id="description"
                  value={draft.description}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  className="min-h-[120px] w-full rounded-2xl border border-[#dde3f5] px-4 py-3 text-sm outline-none focus:border-[#5570ff]"
                  placeholder="Start writing here..."
                />
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </p>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-2xl border border-[#dde3f5] px-6 py-3 text-sm font-semibold text-[#5b6c94] hover:border-[#5570ff] disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-[#5570ff] px-6 py-3 text-sm font-semibold text-white hover:bg-[#4051d7] disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSaving}
                >
                  {isSaving
                    ? "Saving..."
                    : draft.id
                      ? "Save Changes"
                      : "Done"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

interface SortableTodoCardProps {
  todo: TodoItem;
  priorityColors: Record<PriorityLevel, string>;
  onEdit: () => void;
  onDelete: () => void;
}

function SortableTodoCard({
  todo,
  priorityColors,
  onEdit,
  onDelete,
}: SortableTodoCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id.toString() });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex flex-col gap-4 rounded-3xl border border-transparent bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
        isDragging ? "opacity-70 ring-2 ring-[#5570ff]" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-[#0a1b3f]">{todo.title}</h3>
          <p className="mt-1 text-sm text-[#5b6c94]">
            {todo.description || "No description provided."}
          </p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${priorityColors[todo.priority as PriorityLevel] || priorityColors.moderate}`}
        >
          {todo.priority}
        </span>
      </div>
      <p className="text-sm text-[#5b6c94]">
        Due{" "}
        {new Date(todo.todo_date).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={onEdit}
          className="flex-1 rounded-2xl border border-[#dde3f5] px-4 py-2 text-sm font-medium text-[#5570ff] transition hover:border-[#5570ff]"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="flex-1 rounded-2xl border border-red-100 px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

