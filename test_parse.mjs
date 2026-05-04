const code = 'petState.setBubble("这招叫\u0027风火轮\u0027，酷不酷？");';
try {
  new Function(code);
  console.log('Valid JS');
} catch(e) {
  console.log('Error:', e.message);
}
