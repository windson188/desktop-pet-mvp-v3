export function createUIState(initialUI) {
  let state = {
    isAwake: false,
    activeInput: initialUI?.activeInput || null,
    activePanel: initialUI?.activePanel || null
  };

  return {
    getState() {
      return {
        isAwake: state.isAwake,
        activeInput: state.activeInput,
        activePanel: state.activePanel
      };
    },

    wakeUp() {
      state.isAwake = true;
    },

    sleep() {
      state.isAwake = false;
      state.activeInput = null;
      state.activePanel = null;
    },

    toggleInput(type) {
      state.activeInput = state.activeInput === type ? null : type;
      state.isAwake = true;
    },

    closeInput() {
      state.activeInput = null;
    },

    setActiveInput(type) {
      state.activeInput = type;
      state.isAwake = true;
    },

    setActivePanel(panel) {
      state.activePanel = panel;
      state.isAwake = true;
    },

    getIsAwake() {
      return state.isAwake;
    },

    getActiveInput() {
      return state.activeInput;
    },

    getActivePanel() {
      return state.activePanel;
    }
  };
}