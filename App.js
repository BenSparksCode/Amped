import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  SafeAreaView,
} from "react-native";
import { Amplify, DataStore } from "aws-amplify";
import {
  withAuthenticator,
  useAuthenticator,
} from "@aws-amplify/ui-react-native";
import 'core-js/full/symbol/async-iterator';
import { Todo } from "./src/models";
import awsExports from "./src/aws-exports";
import { useTodoStore } from "./src/store/todoStore";

Amplify.configure(awsExports);

const initialState = { name: "", description: "" };

const App = () => {
  const [formState, setFormState] = useState(initialState);
  const [todos, addTodo, setTodos] = useTodoStore((state) => [state.todos, state.addTodo, state.setTodos]);
  // retrieves only the current value of 'user' from 'useAuthenticator'
  const userSelector = (context) => [context.user];

  useEffect(() => {
    // subscribe to new todos being created
    const subscription = DataStore.observeQuery(Todo).subscribe((snapshot) => {
      const {items, isSynced} = snapshot;
      if(JSON.stringify(todos) != JSON.stringify(items)) {
        console.log("Updating todos");
        console.log("prev state:", todos);
        console.log("new state:", items);
        setTodos(items);
      } else {
        console.log("No update to todos needed");
      }
    });

    return function cleanup() {
      subscription.unsubscribe();
    };
  }, []);

  const SignOutButton = () => {
    const { user, signOut } = useAuthenticator(userSelector);
    return (
      <Pressable onPress={signOut} style={styles.buttonContainer}>
        <Text style={styles.buttonText}>
          Hello, {user?.attributes?.email}! {"\n"}Click here to sign out!
        </Text>
      </Pressable>
    );
  };

  function setInput(key, value) {
    setFormState({ ...formState, [key]: value });
  }

  async function addTodoToList() {
    try {
      if (!formState.name || !formState.description) return;
      const todo = { ...formState };
      addTodo(todo);
      setFormState(initialState);
      await DataStore.save(new Todo(todo));
    } catch (err) {
      console.log("error creating todo:", err);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        <SignOutButton />
        <TextInput
          onChangeText={(value) => setInput("name", value)}
          style={styles.input}
          value={formState.name}
          placeholder="Name"
        />
        <TextInput
          onChangeText={(value) => setInput("description", value)}
          style={styles.input}
          value={formState.description}
          placeholder="Description"
        />
        <Pressable onPress={addTodoToList} style={styles.buttonContainer}>
          <Text style={styles.buttonText}>Create todo</Text>
        </Pressable>
        {todos.map((todo, index) => (
          <View key={todo.id ? todo.id : index} style={styles.todo}>
            <Text style={styles.todoName}>{todo.name}</Text>
            <Text style={styles.todoDescription}>{todo.description}</Text>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
};

export default withAuthenticator(App);

const styles = StyleSheet.create({
  container: { width: 400, flex: 1, padding: 20, alignSelf: "center" },
  todo: { marginBottom: 15 },
  input: {
    backgroundColor: "#ddd",
    marginBottom: 10,
    padding: 8,
    fontSize: 18,
  },
  todoName: { fontSize: 20, fontWeight: "bold" },
  buttonContainer: {
    alignSelf: "center",
    backgroundColor: "black",
    paddingHorizontal: 8,
  },
  buttonText: { color: "white", padding: 16, fontSize: 18 },
});
