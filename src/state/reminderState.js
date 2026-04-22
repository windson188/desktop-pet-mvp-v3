export function createReminderState(initialState = {}) {
  let reminders = [];
  let completed = [];

  if (Array.isArray(initialState)) {
    reminders = initialState;
  } else {
    reminders = initialState.reminders || [];
    completed = initialState.completed || [];
  }

  if (completed.length > 5) {
    completed = completed.slice(0, 5);
  }

  return {
    getState() {
      return { reminders, completed };
    },
    getReminders() {
      return reminders;
    },
    getCompleted() {
      return completed;
    },
    addReminder(text, time) {
      if (!text || !text.trim() || !time) return;
      reminders.unshift({
        id: `reminder_${Date.now()}`,
        text: text.trim(),
        time,
        createdAt: Date.now()
      });
    },
    // 编辑提醒（仅文本，时间暂不支持）
    editReminder(id, newText) {
      if (!newText || !newText.trim()) return;
      const reminder = reminders.find(item => item.id === id);
      if (reminder) {
        reminder.text = newText.trim();
      }
    },
    deleteReminder(id) {
      reminders = reminders.filter(item => item.id !== id);
    },
    deleteCompleted(id) {
      completed = completed.filter(item => item.id !== id);
    },
    completeReminder(id) {
      const index = reminders.findIndex(item => item.id === id);
      if (index === -1) return;
      const completedItem = reminders[index];
      const completedRecord = {
        ...completedItem,
        completedAt: Date.now()
      };
      reminders = reminders.filter(item => item.id !== id);
      completed = [completedRecord, ...completed];
      if (completed.length > 5) {
        completed = completed.slice(0, 5);
      }
    },
    clearCompleted() {
      completed = [];
    },
    migrateTriggeredReminders() {
      const triggered = reminders.filter(item => item.triggered === true);
      if (triggered.length === 0) return;
      triggered.forEach(item => {
        const { triggered, ...rest } = item;
        const completedRecord = {
          ...rest,
          completedAt: item.completedAt || Date.now()
        };
        completed = [completedRecord, ...completed];
      });
      reminders = reminders.filter(item => !item.triggered);
      if (completed.length > 5) {
        completed = completed.slice(0, 5);
      }
    }
  };
}