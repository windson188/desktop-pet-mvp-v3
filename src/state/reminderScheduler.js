const reminderTimeouts = new Map();

function clearReminderTimeout(reminderId) {
  const timeoutId = reminderTimeouts.get(reminderId);
  if (timeoutId) {
    clearTimeout(timeoutId);
    reminderTimeouts.delete(reminderId);
  }
}

function clearAllReminderTimeouts() {
  reminderTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
  reminderTimeouts.clear();
}

function scheduleReminder(reminder, deps) {
  clearReminderTimeout(reminder.id);
  const { petState, reminderState, renderAll, showBubble, resetBubbleCycle, persist, updateWindowHeight } = deps;
  const now = Date.now();
  const delay = reminder.time - now;
  const executeReminder = () => {
    petState.setBubble(`主人，记得要${reminder.text}哦！`);
    renderAll();
    showBubble();
    updateWindowHeight();
    resetBubbleCycle({ petState, renderAll });
    petState.applyReminderEffect();
    reminderState.completeReminder(reminder.id);
    persist().then(() => {
      renderAll();
      updateWindowHeight();
      resetBubbleCycle({ petState, renderAll });
    });
  };
  if (delay <= 0) {
    executeReminder();
  } else {
    const timeoutId = setTimeout(() => {
      executeReminder();
      reminderTimeouts.delete(reminder.id);
    }, delay);
    reminderTimeouts.set(reminder.id, timeoutId);
  }
}

export { scheduleReminder, clearReminderTimeout, clearAllReminderTimeouts };
