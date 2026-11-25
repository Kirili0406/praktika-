const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const KEY='finora_html_transactions', BUDGET_KEY='finora_html_budget';
let transactions=JSON.parse(localStorage.getItem(KEY)||'[]'), kind='expense', budget=Number(localStorage.getItem(BUDGET_KEY)||250000);
const colors=['#8876ef','#55cda6','#ff927d','#6b9ee9','#e6bd65','#d77fba','#9296aa'];
const money=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:0}).format(n||0)+' ₸';
const today=new Date(); $('#today').textContent=today.toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'}); $('#txDate').value=today.toISOString().slice(0,10);
function save(){localStorage.setItem(KEY,JSON.stringify(transactions));localStorage.setItem(BUDGET_KEY,budget);render()}
function monthItems(){return transactions.filter(t=>{const d=new Date(t.date+'T12:00:00');return d.getMonth()===today.getMonth()&&d.getFullYear()===today.getFullYear()})}
function totals(items){return items.reduce((a,t)=>{a[t.kind]+=t.amount;return a},{income:0,expense:0})}
function render(){const m=totals(monthItems()),all=totals(transactions);$('#balance').textContent=money(all.income-all.expense);$('#income').textContent=money(m.income);$('#expense').textContent=money(m.expense);$('#donutTotal').textContent=money(m.expense);renderChart();renderCategories();renderRows();renderBudget();renderAdmin()}
function renderChart(){const months=[];for(let i=5;i>=0;i--){const d=new Date(today.getFullYear(),today.getMonth()-i,1);months.push({date:d,label:d.toLocaleDateString('ru-RU',{month:'short'}),income:0,expense:0})}transactions.forEach(t=>{const d=new Date(t.date+'T12:00:00');const x=months.find(m=>m.date.getMonth()===d.getMonth()&&m.date.getFullYear()===d.getFullYear());if(x)x[t.kind]+=t.amount});const max=Math.max(1,...months.flatMap(x=>[x.income,x.expense]));$('#chart').innerHTML=months.map(m=>`<div class="month-bars"><div class="bar-group"><i class="bar" style="height:${Math.max(3,m.income/max*100)}%"></i><i class="bar exp" style="height:${Math.max(3,m.expense/max*100)}%"></i></div><span class="bar-label">${m.label}</span></div>`).join('')}
function renderCategories(){const items=monthItems().filter(t=>t.kind==='expense'),map={};items.forEach(t=>map[t.category]=(map[t.category]||0)+t.amount);const entries=Object.entries(map).sort((a,b)=>b[1]-a[1]);let acc=0;const total=entries.reduce((s,x)=>s+x[1],0);if(total){const parts=entries.map((x,i)=>{const start=acc;acc+=x[1]/total*100;return `${colors[i%colors.length]} ${start}% ${acc}%`});$('#donut').style.background=`conic-gradient(${parts.join(',')})`;$('#categoryLegend').innerHTML=entries.slice(0,5).map((x,i)=>`<div class="legend-row"><span class="legend-name"><i class="legend-dot" style="background:${colors[i%colors.length]}"></i>${esc(x[0])}</span><b>${money(x[1])}</b></div>`).join('')}else{$('#donut').style.background='conic-gradient(#34384b 0 100%)';$('#categoryLegend').innerHTML='<div class="empty">Добавь расходы, чтобы увидеть аналитику</div>'}}
function row(t,withDelete=false){return `<tr><td><span class="tx-name"><i class="tx-icon">${t.kind==='income'?'↗':'↘'}</i>${esc(t.title)}</span></td><td>${esc(t.category)}</td><td>${new Date(t.date+'T12:00:00').toLocaleDateString('ru-RU',{day:'2-digit',month:'short',year:'numeric'})}</td><td class="right amount ${t.kind}">${t.kind==='income'?'+':'−'} ${money(t.amount)}</td>${withDelete?`<td class="right"><button class="link-button delete" data-id="${t.id}">Удалить</button></td>`:''}</tr>`}
function renderRows(){const sorted=[...transactions].sort((a,b)=>b.date.localeCompare(a.date));$('#recentRows').innerHTML=sorted.slice(0,5).map(t=>row(t)).join('')||'<tr><td colspan="4" class="empty">Пока нет операций</td></tr>';const q=$('#search').value.toLowerCase(),f=$('#typeFilter').value;const filtered=sorted.filter(t=>(f==='all'||t.kind===f)&&(t.title.toLowerCase().includes(q)||t.category.toLowerCase().includes(q)));$('#allRows').innerHTML=filtered.map(t=>row(t,true)).join('');$('#emptyState').style.display=filtered.length?'none':'block';$$('.delete').forEach(b=>b.onclick=()=>{transactions=transactions.filter(t=>t.id!==b.dataset.id);save();toast('Операция удалена')})}

function renderAdmin(){
  if(!$('#adminRows'))return;
  const sums=totals(transactions);
  $('#adminCount').textContent=transactions.length;
  $('#adminIncome').textContent=money(sums.income);
  $('#adminExpense').textContent=money(sums.expense);
  const sorted=[...transactions].sort((a,b)=>b.date.localeCompare(a.date));
  $('#adminRows').innerHTML=sorted.map(t=>`<tr><td>${esc(t.title)}</td><td>${t.kind==='income'?'Доход':'Расход'}</td><td>${esc(t.category)}</td><td>${new Date(t.date+'T12:00:00').toLocaleDateString('ru-RU')}</td><td class="right amount ${t.kind}">${t.kind==='income'?'+':'−'} ${money(t.amount)}</td><td class="right"><button class="link-button admin-delete" data-admin-delete="${t.id}">Удалить</button></td></tr>`).join('')||'<tr><td colspan="6" class="empty">Операций пока нет</td></tr>';
  $$('[data-admin-delete]').forEach(b=>b.onclick=()=>{transactions=transactions.filter(t=>t.id!==b.dataset.adminDelete);save();toast('Операция удалена')});
}

function renderBudget(){const spent=totals(monthItems()).expense,pct=Math.min(100,spent/budget*100);$('#budgetSpent').innerHTML=`${money(spent)} <small>/ ${money(budget)}</small>`;$('#budgetProgress').style.width=pct+'%';$('#budgetCaption').textContent=spent>budget?`Лимит превышен на ${money(spent-budget)}`:`Осталось ${money(budget-spent)} до лимита`}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function toast(s){const el=$('#toast');el.textContent=s;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2400)}
function openModal(){ $('#modal').classList.add('open');$('#txTitle').focus() }function closeModal(){$('#modal').classList.remove('open')}
function setKind(k){kind=k;$$('[data-kind]').forEach(b=>b.classList.toggle('selected',b.dataset.kind===k));$('#txCategory').innerHTML=(k==='income'?['Зарплата','Подработка','Подарок','Инвестиции','Другое']:['Продукты','Транспорт','Покупки','Кафе','Коммунальные услуги','Развлечения','Другое']).map(x=>`<option>${x}</option>`).join('')}
let adminUnlocked=false;
const ADMIN_PIN='1234'; // Измени PIN здесь перед публикацией сайта.
function openAdminLogin(){$('#adminPin').value='';$('#loginError').textContent='';$('#adminLogin').classList.add('open');setTimeout(()=>$('#adminPin').focus(),50)}
function closeAdminLogin(){$('#adminLogin').classList.remove('open')}
$$('.nav-link').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.page==='admin'&&!adminUnlocked){openAdminLogin();return}go(b.dataset.page)}));$$('[data-open]').forEach(b=>b.onclick=()=>go(b.dataset.open));
function go(id){$$('.page').forEach(p=>p.classList.toggle('active',p.id===id));$$('.nav-link').forEach(b=>b.classList.toggle('active',b.dataset.page===id));$('#pageHeading').textContent=({dashboard:'Обзор',transactions:'Операции',budgets:'Бюджет',profile:'Профиль',admin:'Админ-панель'})[id]||'Обзор';if(id==='admin')renderAdmin()}
$('#addTop').onclick=openModal;$('#addTransaction').onclick=openModal;$('#closeModal').onclick=closeModal;$('#modal').onclick=e=>{if(e.target===$('#modal'))closeModal()};$$('[data-kind]').forEach(b=>b.onclick=()=>setKind(b.dataset.kind));
$('#transactionForm').onsubmit=e=>{e.preventDefault();const amount=Number($('#txAmount').value);if(!Number.isFinite(amount)||amount<=0)return;transactions.push({id:crypto.randomUUID(),title:$('#txTitle').value.trim(),amount,category:$('#txCategory').value,date:$('#txDate').value,kind});save();e.target.reset();$('#txDate').value=today.toISOString().slice(0,10);setKind('expense');closeModal();toast('Операция успешно добавлена')};
$('#search').oninput=renderRows;$('#typeFilter').onchange=renderRows;$('#editBudget').onclick=()=>{const n=prompt('Укажи новый месячный лимит в тенге:',budget);if(n!==null&&Number(n)>0){budget=Number(n);save();toast('Лимит обновлён')}};
function askClear(){ $('#clearConfirm').classList.add('open') }
function closeClear(){ $('#clearConfirm').classList.remove('open') }
$('#clearData').onclick=askClear;
$('#adminClear').onclick=askClear;
$('#cancelClear').onclick=closeClear;
$('#confirmClear').onclick=()=>{transactions=[];budget=250000;save();closeClear();toast('Все данные успешно очищены')};
$('#clearConfirm').onclick=e=>{if(e.target===$('#clearConfirm'))closeClear()};
$('#cancelAdminLogin').onclick=closeAdminLogin;
$('#adminLogin').onclick=e=>{if(e.target===$('#adminLogin'))closeAdminLogin()};
$('#adminLoginForm').onsubmit=e=>{e.preventDefault();if($('#adminPin').value===ADMIN_PIN){adminUnlocked=true;closeAdminLogin();go('admin');toast('Доступ администратора открыт')}else{$('#loginError').textContent='Неверный PIN-код. Попробуйте ещё раз.';$('#adminPin').select()}};
setKind('expense');render();