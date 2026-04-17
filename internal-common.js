(function(){
  const firebaseConfig = {
    apiKey: "AIzaSyB7p69J89r5Kwu2YgawkBb9omjojdM4HTM",
    authDomain: "farmaciamontesano.firebaseapp.com",
    projectId: "farmaciamontesano",
    storageBucket: "farmaciamontesano.firebasestorage.app",
    messagingSenderId: "881461241551",
    appId: "1:881461241551:web:c74d6ee74cb857fa5179ba"
  };
  if (typeof firebase !== 'undefined' && !firebase.apps.length) firebase.initializeApp(firebaseConfig);
  const db = typeof firebase !== 'undefined' ? firebase.firestore() : null;

  const EMPLOYEE_STORAGE_KEY = 'fm_employee_session_v1';
  const EMPLOYEE_IDS = ['cosimo','daniela','patrizia'];
  const FALLBACK_EMPLOYEES = {
    cosimo:{id:'cosimo',name:'Dott. Cosimo',pin:'1111',active:true},
    daniela:{id:'daniela',name:'Dott.ssa Daniela',pin:'2222',active:true},
    patrizia:{id:'patrizia',name:'Dott.ssa Patrizia',pin:'3333',active:true},
    annamaria:{id:'annamaria',name:'Sig. Annamaria',pin:'4444',active:true},
    annalisa:{id:'annalisa',name:'Dott.ssa Annalisa',pin:'5555',active:true}
  };

  function nowMeta(){ const d=new Date(); return {createdAt:d.toISOString(),createdDate:d.toISOString().slice(0,10),createdTime:d.toTimeString().slice(0,5)}; }
  function fmtDateIT(s){ if(!s) return '—'; const p=String(s).split('-'); return p.length===3 ? `${p[2]}-${p[1]}-${p[0]}` : s; }
  function monthKey(date=new Date()){ return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`; }
  function saveEmployeeSession(emp){ localStorage.setItem(EMPLOYEE_STORAGE_KEY, JSON.stringify(emp)); localStorage.setItem('user', emp.id); localStorage.setItem('farmaciaCurrentUser', emp.name); localStorage.setItem('farmaciaLoggedIn', 'true'); }
  function getEmployeeSession(){ try{return JSON.parse(localStorage.getItem(EMPLOYEE_STORAGE_KEY)||'null')}catch(e){return null;} }
  function clearEmployeeSession(){ localStorage.removeItem(EMPLOYEE_STORAGE_KEY); localStorage.removeItem('user'); }
  function requireEmployeeSession(){ const s=getEmployeeSession(); if(!s){ location.href='dipendenti-login.html'; throw new Error('Sessione dipendente mancante'); } return s; }

  async function getEmployeesMap(){
    if(!db) return FALLBACK_EMPLOYEES;
    try{
      const snap = await db.collection('employees').get();
      if(snap.empty) return FALLBACK_EMPLOYEES;
      const map={}; snap.forEach(doc=>map[doc.id]={id:doc.id,...doc.data()});
      return {...FALLBACK_EMPLOYEES,...map};
    }catch(e){ return FALLBACK_EMPLOYEES; }
  }

  async function getDocSafe(pathA,pathB){
    try{ const doc = await db.collection(pathA).doc(pathB).get(); return doc.exists ? doc.data() : null; } catch(e){ return null; }
  }
  async function setDocMerge(pathA,pathB,data){ return db.collection(pathA).doc(pathB).set(data,{merge:true}); }
  async function addOwnerNotification(data){
    if(!db) return;
    return db.collection('owner_notifications').add({read:false, type:'generic', ...nowMeta(), ...data});
  }
  async function addEmployeeNotification(employeeId,data){
    if(!db || !employeeId) return;
    const id = db.collection('employee_notifications').doc();
    return id.set({employeeId, read:false, ...nowMeta(), ...data});
  }
  async function getEmployeeProfile(employeeId){
    return await getDocSafe('employee_profiles', employeeId) || {notifications:{ferie:true,consumabili:true,ldf:true}, pushEnabled:false};
  }
  function workdaysInMonth(year, month1){
    let c=0; const days=new Date(year,month1,0).getDate();
    for(let d=1; d<=days; d++){ const wd = new Date(year,month1-1,d).getDay(); if(wd!==0) c++; }
    return c;
  }
  function elapsedWorkdaysInMonth(year, month1, today=new Date()){
    const sameMonth = today.getFullYear()===year && today.getMonth()+1===month1;
    const maxDay = sameMonth ? today.getDate() : new Date(year,month1,0).getDate();
    let c=0; for(let d=1; d<=maxDay; d++){ const wd=new Date(year,month1-1,d).getDay(); if(wd!==0) c++; } return c;
  }
  function monthLabel(key){ const [y,m]=String(key).split('-').map(Number); return new Date(y,m-1,1).toLocaleDateString('it-IT',{month:'long',year:'numeric'}); }
  window.InternalApp = { firebaseConfig, db, EMPLOYEE_STORAGE_KEY, FALLBACK_EMPLOYEES, EMPLOYEE_IDS, nowMeta, fmtDateIT, monthKey, saveEmployeeSession, getEmployeeSession, clearEmployeeSession, requireEmployeeSession, getEmployeesMap, getDocSafe, setDocMerge, addOwnerNotification, addEmployeeNotification, getEmployeeProfile, workdaysInMonth, elapsedWorkdaysInMonth, monthLabel };
})();
