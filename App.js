import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  Pressable,
  SafeAreaView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Amplify, DataStore } from "aws-amplify";
import {
  withAuthenticator,
  useAuthenticator,
} from "@aws-amplify/ui-react-native";
import "core-js/full/symbol/async-iterator";
import { Todo } from "./src/models";
import awsExports from "./src/aws-exports";
import { useTodoStore } from "./src/store/todoStore";

// UI STUFF
import {
  Header as HeaderRNE,
  HeaderProps,
  Icon,
  Divider,
  Card,
  Button,
} from "@rneui/themed";

Amplify.configure(awsExports);

const initialState = { name: "", description: "" };

const App = () => {
  const [formState, setFormState] = useState(initialState);
  const [todos, addTodo, setTodos] = useTodoStore((state) => [
    state.todos,
    state.addTodo,
    state.setTodos,
  ]);
  // retrieves only the current value of 'user' from 'useAuthenticator'
  const userSelector = (context) => [context.user];

  useEffect(() => {
    // subscribe to new todos being created
    const subscription = DataStore.observeQuery(Todo).subscribe((snapshot) => {
      const { items, isSynced } = snapshot;
      if (JSON.stringify(todos) != JSON.stringify(items)) {
        console.log("Updating todos");
        console.log(
          "prev state:",
          todos.map((todo) => todo.name)
        );
        console.log(
          "new state:",
          items.map((item) => item.name)
        );
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

    async function handleSignOut() {
      await DataStore.clear();
      signOut();
    }

    return (
      <Pressable onPress={handleSignOut} style={styles.buttonContainer}>
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

  async function deleteTodo(id) {
    // await DataStore.clear();
    const toDelete = await DataStore.query(Todo, id);
    if (toDelete) {
      DataStore.delete(toDelete);
    }
  }

  const handleBackPressed = () => {
    console.log("Back button pressed");
  };

  return (
    <>
      <HeaderRNE
        containerStyle={{
          backgroundColor: "green",
          width: "100%",
          height: 100,
          paddingTop: 50,
        }}
        leftComponent={
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={handleBackPressed}>
              <Icon name="arrow-back" color="white" />
            </TouchableOpacity>
          </View>
        }
        rightComponent={
          <View style={styles.headerRight}>
            <TouchableOpacity>
              <Icon name="menu" color="white" />
            </TouchableOpacity>
          </View>
        }
        centerComponent={{
          text: "Amped",
          style: { fontSize: 30, color: "white" },
        }}
      />
      <SafeAreaView style={styles.container}>
        <View style={styles.container}>
          <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}
          >
            <View>
              <SignOutButton />

              <Divider width={2} color={"green"} style={styles.divider} />

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

              <Divider width={2} color={"green"} style={styles.divider} />
            </View>
          </TouchableWithoutFeedback>
          <View style={{ height: 450 }}>
            <FlatList
              keyboardDismissMode="on-drag"
              data={todos}
              renderItem={({ item }) => (
                <Card>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={styles.todoName}>{item.name}</Text>
                    <Button
                      onPress={() => deleteTodo(item.id)}
                      title="deleet"
                      buttonStyle={{ backgroundColor: "rgba(214, 61, 57, 1)" }}
                      containerStyle={{ width: 75 }}
                    />
                  </View>

                  <Text style={styles.todoDescription}>{item.description}</Text>
                </Card>
              )}
              keyExtractor={(item) => item.id}
            />
          </View>
        </View>
      </SafeAreaView>
    </>
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
  divider: {
    marginVertical: 10,
  },
});
