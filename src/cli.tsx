import { render } from "ink";
import React from "react";
import { TaskManager } from "./ui/components/task-manager.js";
import { JsonTaskRepository } from "./repository/json-task-repository.js";

const App = () => {
  const taskRepository = new JsonTaskRepository();
  
  return <TaskManager taskRepository={taskRepository} />;
};

render(<App />);