// Pro Todo — features: drag-drop, localStorage, dark mode, search, progress

// constants / elements
const ul = document.getElementById('myUL');
const input = document.getElementById('myInput');
const prioSel = document.getElementById('prioSelect');
const addBtn = document.getElementById('addBtn');
const searchBox = document.getElementById('searchBox');
const darkToggle = document.getElementById('darkToggle');
const progressFill = document.getElementById('progressFill');
const doneCount = document.getElementById('doneCount');
const totalCount = document.getElementById('totalCount');

let todos = []; // array of {id,text,checked,priority,time}
let dragSrcId = null;

// init
loadTheme();
loadTodos();
bindEvents();

// utilities
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,6) }

function saveTodos(){
  localStorage.setItem('pro_todos_v1', JSON.stringify(todos));
  render();
}

function loadTodos(){
  const raw = localStorage.getItem('pro_todos_v1');
  todos = raw ? JSON.parse(raw) : [];
  render();
}

// create DOM li from item
function createLi(item){
  const li = document.createElement('li');
  li.setAttribute('draggable','true');
  li.dataset.id = item.id;
  li.className = item.priority + (item.checked ? ' checked' : '');
  // left part
  const left = document.createElement('div'); left.className='left';
  const txt = document.createElement('div'); txt.className='txt'; txt.textContent = item.text;
  const ts = document.createElement('div'); ts.className='ts'; ts.textContent = item.time;
  left.appendChild(txt); left.appendChild(ts);
  // right part
  const right = document.createElement('div'); right.className='right';
  const close = document.createElement('div'); close.className='close'; close.textContent='×';
  right.appendChild(close);
  // assemble
  li.appendChild(left); li.appendChild(right);

  // events
  li.addEventListener('click', (e)=>{
    if(e.target === close) return; // deletion handled separately
    toggleChecked(item.id);
  });

  close.addEventListener('click',(e)=>{
    e.stopPropagation();
    removeTodo(item.id);
  });

  li.addEventListener('dblclick', (e)=>{
    e.stopPropagation();
    const newText = prompt('Edit task:', item.text);
    if(newText !== null){
      updateTodoText(item.id, newText.trim());
    }
  });

  // drag events
  li.addEventListener('dragstart', (e)=>{
    dragSrcId = item.id;
    li.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });
  li.addEventListener('dragend', ()=>{
    dragSrcId = null;
    li.classList.remove('dragging');
  });

  li.addEventListener('dragover',(e)=>{
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  });

  li.addEventListener('drop',(e)=>{
    e.preventDefault();
    const targetId = li.dataset.id;
    if(!dragSrcId || dragSrcId === targetId) return;
    reorder(dragSrcId, targetId);
  });

  return li;
}

// render UI
function render(){
  // clear and append in todos order
  ul.innerHTML = '';
  todos.forEach(item => ul.appendChild(createLi(item)));

  // update progress
  const total = todos.length;
  const done = todos.filter(t=>t.checked).length;
  const pct = total ? Math.round((done/total)*100) : 0;
  progressFill.style.width = pct + '%';
  doneCount.textContent = done;
  totalCount.textContent = total;
}

// CRUD
function addTodo(text, priority){
  const item = { id: uid(), text, checked:false, priority: priority||'low', time: new Date().toLocaleString() };
  todos.unshift(item); // newest on top
  saveTodos();
}

function removeTodo(id){
  todos = todos.filter(t=>t.id !== id);
  saveTodos();
}

function toggleChecked(id){
  todos = todos.map(t => t.id===id ? {...t, checked: !t.checked} : t);
  saveTodos();
}

function updateTodoText(id, newText){
  todos = todos.map(t => t.id===id ? {...t, text:newText} : t);
  saveTodos();
}

function clearDone(){
  if(!confirm('Remove all completed tasks?')) return;
  todos = todos.filter(t=>!t.checked);
  saveTodos();
}

function clearAll(){
  if(!confirm('Clear all tasks?')) return;
  todos = [];
  saveTodos();
}

// reorder: move draggedId to position of targetId
function reorder(dragId, targetId){
  const fromIndex = todos.findIndex(t=>t.id===dragId);
  const toIndex = todos.findIndex(t=>t.id===targetId);
  if(fromIndex<0 || toIndex<0) return;
  const [moved] = todos.splice(fromIndex,1);
  todos.splice(toIndex,0,moved);
  saveTodos();
}

// search filter
function doSearch(q){
  const lower = q.trim().toLowerCase();
  Array.from(ul.children).forEach(li=>{
    const txt = li.querySelector('.txt').textContent.toLowerCase();
    li.style.display = txt.includes(lower) ? '' : 'none';
  });
}

// theme
// theme

function loadTheme(){
  const t = localStorage.getItem('pro_theme') || 'dark';
  if(t==='dark') document.body.classList.add('dark');
  darkToggle.textContent = t==='dark' ? '☀️' : '🌙';
}
function toggleTheme(){
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem('pro_theme', isDark? 'dark':'light');
  darkToggle.textContent = isDark ? '☀️' : '🌙';
}

// binding
function bindEvents(){
  addBtn.addEventListener('click', ()=>{
    const txt = input.value.trim();
    if(!txt) return input.focus();
    addTodo(txt, prioSel.value);
    input.value = '';
    input.focus();
  });

  input.addEventListener('keypress', (e)=>{ if(e.key==='Enter') addBtn.click(); });

  document.getElementById('clearDone').addEventListener('click', clearDone);
  document.getElementById('clearAll').addEventListener('click', clearAll);

  searchBox.addEventListener('input', (e)=> doSearch(e.target.value) );

  darkToggle.addEventListener('click', toggleTheme);

  // enable dropping between items (allow dropping on list)
  ul.addEventListener('dragover',(e)=> e.preventDefault());
  ul.addEventListener('drop', (e)=>{
    // if dropped on empty area, move dragged to end
    if(!dragSrcId) return;
    const listIds = todos.map(t=>t.id);
    // if null target place to last position
    const fromIndex = listIds.indexOf(dragSrcId);
    if(fromIndex>=0){
      const [moved] = todos.splice(fromIndex,1);
      todos.push(moved);
      saveTodos();
    }
  });

  // keyboard accessibility: focus search on /
  window.addEventListener('keydown', (e)=>{
    if(e.key === '/') { e.preventDefault(); searchBox.focus(); }
  });
}
