import {create} from "zustand";

export const useTodoStore = create((set) => ({
    todos: [],
    addTodo: (todo) => set((state) => ({todos: [...state.todos, todo]})),
    setTodos: (todos) => set({todos}),
}));