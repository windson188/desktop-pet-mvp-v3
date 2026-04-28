// src/ui/modalController.js

/**
 * 显示自定义编辑模态框
 * @param {string} title - 模态框标题
 * @param {string} [defaultValue=''] - 输入框默认值
 * @returns {Promise<string|null>} 用户输入的内容，取消返回 null
 */
export function showEditDialog(title, defaultValue = '') {
  return new Promise((resolve) => {
    const modal = document.getElementById('edit-modal');
    const modalTitle = document.getElementById('modal-title');
    const input = document.getElementById('modal-input');
    const confirmBtn = document.getElementById('modal-confirm');
    const cancelBtn = document.getElementById('modal-cancel');

    if (!modal) {
      console.error('模态框元素未找到，请确保 index.html 中包含 #edit-modal');
      resolve(null);
      return;
    }

    modalTitle.textContent = title;
    input.value = defaultValue;
    modal.classList.remove('hidden');

    const cleanup = () => {
      modal.classList.add('hidden');
      confirmBtn.removeEventListener('click', onConfirm);
      cancelBtn.removeEventListener('click', onCancel);
      input.removeEventListener('keypress', onKeyPress);
    };

    const onConfirm = () => {
      const value = input.value.trim();
      cleanup();
      resolve(value === '' ? null : value);
    };

    const onCancel = () => {
      cleanup();
      resolve(null);
    };

    const onKeyPress = (e) => {
      if (e.key === 'Enter') onConfirm();
    };

    confirmBtn.addEventListener('click', onConfirm);
    cancelBtn.addEventListener('click', onCancel);
    input.addEventListener('keypress', onKeyPress);
    input.focus();
    input.select();
  });
}
