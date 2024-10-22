import { useState, useEffect } from 'react';
import { addTodo, deleteTodo, getTodos, updateTodo } from '../api/todos';
import { Todo } from '../types/Todo';
import { ErrorMessages } from '../types/ErrorMessages';

export const useTodos = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [errorMessage, setErrorMessage] = useState<ErrorMessages>(
    ErrorMessages.NO_ERROR,
  );
  const [isReceivingAnswer, setIsReceivingAnswer] = useState(false);
  const [loadingTodoIds, setLoadingTodoIds] = useState<number[]>([]);
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [editedTodoId, setEditedTodoId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState('');

  const handleErrorReset = () => {
    setErrorMessage(ErrorMessages.NO_ERROR);
  };

  const handleErrorMessage = (error: ErrorMessages) => {
    setErrorMessage(error);
    setTimeout(handleErrorReset, 3000);
  };

  useEffect(() => {
    getTodos()
      .then(setTodos)
      .catch(() => handleErrorMessage(ErrorMessages.UNABLE_TO_LOAD_TODO));
  }, []);

  const handleAddTodo = (newTodo: Todo) => {
    setTempTodo(newTodo);
    setIsReceivingAnswer(true);

    addTodo(newTodo)
      .then(todo => {
        setTodos(currentTodos => [...currentTodos, todo]);
        setNewTitle('')
      })
      .catch(() => handleErrorMessage(ErrorMessages.UNABLE_TO_ADD_TODO))
      .finally(() => {
        setTempTodo(null);
        setIsReceivingAnswer(false);
      });
  };

  const handleTodoDelete = (todoId: number) => {
    setLoadingTodoIds(currentIds => [...currentIds, todoId]);
    setIsReceivingAnswer(true);
    deleteTodo(todoId)
      .then(() =>
        setTodos(currentTodos =>
          currentTodos.filter(todo => todo.id !== todoId),
        ),
      )
      .catch(() => handleErrorMessage(ErrorMessages.UNABLE_TO_DELETE_TODO))
      .finally(() => {
        setLoadingTodoIds(currentIds => currentIds.filter(id => id !== todoId));
        setIsReceivingAnswer(false);
      });
  };

  const handleTodoUpdate = (id: number, updatedTodo: Partial<Todo>) => {
    setIsReceivingAnswer(true);
    setLoadingTodoIds(currentIds => [...currentIds, id]);

    updateTodo(id, updatedTodo)
      .then(todo => {
        setTodos(currentTodos =>
          currentTodos.map(t => (t.id === id ? { ...t, ...todo } : t)),
        );
        setEditedTodoId(null);
      })
      .catch(() => handleErrorMessage(ErrorMessages.UNABLE_TO_UPDATE_TODO))
      .finally(() => {
        setLoadingTodoIds(currentIds =>
          currentIds.filter(currentId => currentId !== id),
        );
        setIsReceivingAnswer(false);
      });
  };

  const handleCompletedDelete = () => {
    const completedTodos = todos.filter(todo => todo.completed);
    setIsReceivingAnswer(true);
    setLoadingTodoIds(currentIds => [
      ...currentIds,
      ...completedTodos.map(todo => todo.id),
    ]);

    Promise.all(
      completedTodos.map(completedTodo => handleTodoDelete(completedTodo.id)),
    ).finally(() => setIsReceivingAnswer(false));
  };

  const handleToggleAll = () => {
    const newStatus = !todos.every(todo => todo.completed);

    const todosToUpdate = !newStatus
      ? todos
      : todos.filter(todo => !todo.completed);

    setIsReceivingAnswer(true);
    setLoadingTodoIds(currentIds => [
      ...currentIds,
      ...todosToUpdate.map(todo => todo.id),
    ]);

    Promise.all(
      todosToUpdate.map(todo =>
        handleTodoUpdate(todo.id, { completed: newStatus }),
      ),
    ).finally(() => setIsReceivingAnswer(false));
  };

  return {
    todos,
    tempTodo,
    errorMessage,
    isReceivingAnswer,
    loadingTodoIds,
    newTitle,
    editedTodoId,
    setEditedTodoId,
    setNewTitle,
    handleAddTodo,
    handleTodoDelete,
    handleTodoUpdate,
    handleCompletedDelete,
    handleToggleAll,
    handleErrorMessage,
    handleErrorReset,
  };
};
