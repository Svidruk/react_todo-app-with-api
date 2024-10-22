/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState } from 'react';
import { addTodo, getTodos, deleteTodo, updateTodo } from './api/todos';
import { Header } from './components/Header';
import { TodoList } from './components/TodoList';
import { Footer } from './components/Footer';
import { ErrorNotification } from './components/ErrorNotification';
import { Todo } from './types/Todo';
import { ErrorMessages } from './types/ErrorMessages';
import { FilterOptions } from './types/FilterOptions';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filterOption, setFilterOption] = useState<FilterOptions>(
    FilterOptions.DEFAULT,
  );
  const [errorMessage, setErrorMessage] = useState<ErrorMessages>(
    ErrorMessages.NO_ERROR,
  );
  const [newTitle, setNewTitle] = useState('');
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [isReceivingAnswer, setIsReceivingAnswer] = useState(false);
  const [loadingTodoIds, setLoadingTodoIds] = useState<number[]>([]);
  const [editedTodoId, setEditedTodoId] = useState<number | null>(null);

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
      .catch(() => {
        handleErrorMessage(ErrorMessages.UNABLE_TO_LOAD_TODO);
      });
  }, []);

  const handleEditTodo = (id: number | null) => {
    setEditedTodoId(id);
  };

  const handleAddTodo = (newTodo: Todo) => {
    setTempTodo(newTodo);
    setIsReceivingAnswer(true);

    addTodo(newTodo)
      .then(todo => {
        setTodos(currentTodos => [...currentTodos, todo]);
        setNewTitle('');
      })
      .catch(() => {
        handleErrorMessage(ErrorMessages.UNABLE_TO_ADD_TODO);
      })
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

  /*const handleCompletedDelete = () => {
    const completedTodos = todos.filter(todo => todo.completed);
    setIsReceivingAnswer(true);
    setLoadingTodoIds(currentIds => [
      ...currentIds,
      ...completedTodos.map(todo => todo.id),
    ]);

    Promise.all(
      completedTodos.map(completedTodo =>
        deleteTodo(completedTodo.id)
          .then(() => {
            setTodos(currentTodos =>
              currentTodos.filter(todo => todo.id !== completedTodo.id),
            );
          })
          .catch(() => handleErrorMessage(ErrorMessages.UNABLE_TO_DELETE_TODO))
          .finally(() => {
            setLoadingTodoIds(currentIds =>
              currentIds.filter(id => id !== completedTodo.id),
            );
          }),
      ),
    ).finally(() => setIsReceivingAnswer(false));
  };*/

  const handleCompletedDelete = () => {
    const completedTodos = todos.filter(todo => todo.completed);
    setIsReceivingAnswer(true);
    setLoadingTodoIds(currentIds => [
      ...currentIds,
      ...completedTodos.map(todo => todo.id),
    ]);

    Promise.all(
      completedTodos.map(
        completedTodo => handleTodoDelete(completedTodo.id), // Reuse handleTodoDelete for each completed todo
      ),
    ).finally(() => setIsReceivingAnswer(false));
  };

  const handleTodoUpdate = (id: number, updatedTodo: Partial<Todo>) => {
    setIsReceivingAnswer(true);

    setLoadingTodoIds(currentIds => [...currentIds, id]);

    updateTodo(id, updatedTodo)
      .then(todo => {
        setTodos(currentTodos =>
          currentTodos.map(t => (t.id === id ? { ...t, ...todo } : t)),
        );
        handleEditTodo(null);
      })
      .catch(() => {
        handleErrorMessage(ErrorMessages.UNABLE_TO_UPDATE_TODO);
      })
      .finally(() => {
        setIsReceivingAnswer(false);
        setLoadingTodoIds(currentIds => currentIds.filter(id => id !== id));
      });
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
        updateTodo(todo.id, {
          completed: newStatus,
        })
          .then(() => {
            setTodos(currentTodos =>
              currentTodos.map(t =>
                t.id === todo.id ? { ...t, completed: newStatus } : t,
              ),
            );
          })
          .catch(() => handleErrorMessage(ErrorMessages.UNABLE_TO_UPDATE_TODO))
          .finally(() => {
            setLoadingTodoIds(currentIds =>
              currentIds.filter(id => id !== todo.id),
            );
          }),
      ),
    ).finally(() => setIsReceivingAnswer(false));
  };

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <Header
          todos={todos}
          newTitle={newTitle}
          receivingAnswer={isReceivingAnswer}
          onAddTodo={handleAddTodo}
          onCheckForErrors={handleErrorMessage}
          setNewTitle={setNewTitle}
          onToggleAll={handleToggleAll}
        />

        <TodoList
          tempTodo={tempTodo}
          todos={todos}
          loadingTodoIds={loadingTodoIds}
          filterOption={filterOption}
          editedTodoId={editedTodoId}
          onTodoDelete={handleTodoDelete}
          onTodoUpdate={handleTodoUpdate}
          onEditTodo={handleEditTodo}
        />

        {todos.length > 0 && (
          <Footer
            todos={todos}
            currentFilter={filterOption}
            onFilterOptionChange={setFilterOption}
            onCompletedDelete={handleCompletedDelete}
          />
        )}
      </div>

      <ErrorNotification
        errorMessage={errorMessage}
        onResetError={handleErrorReset}
      />
    </div>
  );
};
