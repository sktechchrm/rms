import{K as k,r as D,u as H,j as e,L as X,M as ee,N as te,O as ie,a as ne,G as ae,H as se}from"./index-9tEm8_GH.js";import{B as Y,P as Z,u as re}from"./printCSS-DincT00K.js";import{D as E,M as oe}from"./ModuleShell-T6xQR9Un.js";import"./DatabaseFactory-Dsvnyzof.js";import"./AuthorityIconButton-DCDtncT5.js";import"./DataUseCases-D3ll17fR.js";const le=["মাসিক","দ্বি-মাসিক","ত্রৈমাসিক","অর্ধ-বার্ষিক","বার্ষিক","বিশেষ","অত্যাবশ্যক","বোর্ড","কমিটি","প্রকল্প","দল","অন্যান্য"],de=["Pending","In Progress","Completed"];k.map(t=>({id:t.id,name:t.name,address:t.address}));k.flatMap(t=>t.committees.map(i=>({id:`${t.id}__${i.id}`,name:i.name,chairperson:i.chairperson,secretary:i.secretary})));const P={organizationName:"",organizationAddress:"",department:"",meetingTitle:"",meetingEstablishDate:"",meetingType:"মাসিক",meetingNumber:"",noticeDate:new Date().toISOString().split("T")[0],meetingDate:new Date().toISOString().split("T")[0],startTime:"",endTime:"",venue:"",virtualMeetingLink:"",meetingImage:"",chairperson:"",secretary:"",attendees:[],previousMinutesReference:"",previousMinutesApproval:"N/A",previousMinutesRejectionDetails:"",agendaItems:[],generalNotes:"",closingNotes:"",annexures:[],nextMeetingDate:"",nextMeetingTime:"",nextMeetingVenue:"",preparedBy:"",preparedByDesignation:"",preparedDate:new Date().toISOString().split("T")[0],reviewedBy:"",reviewedByDesignation:"",reviewedDate:"",approvedBy:"",approvedByDesignation:"",approvedDate:"",authority1:"",authority1Designation:"কারখানা প্রধান",authority1Date:"",authority2:"",authority2Designation:"ব্যবস্থাপক (মানবসম্পদ, প্রশাসন ও সম্মতি)",authority2Date:"",showPreparedBy:!0,showReviewedBy:!0,showApprovedBy:!0,showAuthority1:!0,showAuthority2:!0,distributionList:[]},ce=(t,i)=>{if(!t||!i)return"";const[n,s]=t.split(":").map(Number),[p,a]=i.split(":").map(Number);let m=n*60+s,x=p*60+a;x<m&&(x+=1440);const r=x-m;if(r<=0)return"";const g=Math.floor(r/60),h=r%60;return g>0&&h>0?`${g} hour${g>1?"s":""} ${h} minute${h>1?"s":""}`:g>0?`${g} hour${g>1?"s":""}`:`${h} minute${h>1?"s":""}`},I=()=>`${Date.now()}-${Math.random().toString(36).substr(2,9)}`,K=t=>{const i=t.filter(a=>a.attendanceStatus==="Present").length,n=t.filter(a=>a.attendanceStatus==="Absent").length,s=t.length,p=s>0?Math.round(i/s*100):0;return{present:i,absent:n,total:s,presentPercentage:p}},pe=(t="MIN")=>{const i=new Date().getFullYear(),n=Math.floor(Math.random()*1e3).toString().padStart(3,"0");return`${t}-${i}-${n}`},ge=["কনফারেন্স রুম","কনফারেন্স হল","বোর্ড রুম","ট্রেনিং রুম","ডাইনিং হল","কারখানার প্রধান কক্ষ","মিটিং রুম","অডিটোরিয়াম"];function xe(t){if(!t)return{male:0,female:0,total:0};const i=[];t.chairpersonGender&&i.push(t.chairpersonGender),t.secretaryGender&&i.push(t.secretaryGender);for(const n of t.members??[])n.gender&&i.push(n.gender);return{male:i.filter(n=>n==="পুরুষ").length,female:i.filter(n=>n==="মহিলা").length,total:i.length}}function he(t,i){if(!t)return"";const[n,s]=t.split(":").map(Number),p=(n+i)%24;return`${String(p).padStart(2,"0")}:${String(s).padStart(2,"0")}`}function me(t){return t?parseInt(t.split(":")[0])>=12?{text:"বিকাল",bg:"#e0e7ff",color:"#4338ca"}:{text:"সকাল",bg:"#fef3c7",color:"#92400e"}:null}const be=["০","১","২","৩","৪","৫","৬","৭","৮","৯"];function fe(t){return String(t).split("").map(i=>be[parseInt(i)]??i).join("")}function ue(t){return{id:I(),itemNumber:String(t),topic:"",presenter:"",timeAllocated:"",discussion:"",decisions:[],actionItems:[]}}function ye({minutes:t,setMinutes:i}){const n=H();D.useEffect(()=>{const c=k.find(b=>b.id===n.id)??k[0];c&&i({...t,organizationName:c.name,organizationAddress:c.address})},[n.id]);const s=c=>i({...t,...c}),p=()=>s({agendaItems:[...t.agendaItems,ue(t.agendaItems.length+1)]}),a=(c,b)=>s({agendaItems:t.agendaItems.map(l=>l.id===c?{...l,topic:b}:l)}),m=c=>s({agendaItems:t.agendaItems.filter(b=>b.id!==c).map((b,l)=>({...b,itemNumber:String(l+1)}))}),x=c=>{const l=((k.find(d=>d.name===t.organizationName)??k[0])?.committees??k.flatMap(d=>d.committees)).find(d=>d.id===c);l&&s({meetingTitle:l.name,meetingEstablishDate:l.establishDate??t.meetingEstablishDate,meetingNumber:pe(),chairperson:l.chairperson,secretary:l.secretary,attendees:r(l)})},r=c=>{const b=[{id:I(),name:c.chairperson,designation:c.chairpersonDesignation??"",department:c.chairpersonDept??"",email:"",attendanceStatus:"Present",committeeRole:"সভাপতি"},{id:I(),name:c.secretary,designation:c.secretaryDesignation??"",department:c.secretaryDept??"",email:"",attendanceStatus:"Present",committeeRole:"সচিব"},...(c.members??[]).map(d=>({id:I(),name:d.name,designation:d.designation,department:d.section,email:"",attendanceStatus:"Present",committeeRole:d.role??"সদস্য"}))],l=Array.from({length:5},()=>({id:I(),name:"",designation:"",department:"",email:"",attendanceStatus:"Present",committeeRole:"অতিথি"}));return[...b,...l]},g=k.find(c=>c.name===t.organizationName),h=g?g.committees:k.flatMap(c=>c.committees),f=h.find(c=>c.name===t.meetingTitle),j=xe(f),w=me(t.startTime);return e.jsxs("div",{className:"bis-wrap",children:[e.jsxs("div",{className:"bis-card",children:[e.jsxs("div",{className:"bis-card-header",children:[e.jsx("i",{className:"ti ti-calendar-event","aria-hidden":"true"}),e.jsx("span",{children:"মিটিং সময়সূচি"})]}),e.jsxs("div",{className:"bis-body",children:[e.jsxs("div",{className:"bis-field bis-r1a",children:[e.jsx("label",{className:"bis-label",children:"কমিটি নির্বাচন *"}),e.jsxs("select",{className:"bis-select",value:h.find(c=>c.name===t.meetingTitle)?.id??"",onChange:c=>x(c.target.value),children:[e.jsx("option",{value:"",children:"— কমিটি নির্বাচন করুন —"}),h.map(c=>e.jsx("option",{value:c.id,children:c.name},c.id))]}),f&&e.jsxs("p",{className:"bis-hint bis-hint-green",children:["✓ সভাপতি: ",f.chairperson," · সচিব: ",f.secretary,j.total>0&&e.jsxs("span",{children:[" · মোট ",j.total," জন (",e.jsxs("span",{style:{color:"#db2777"},children:["নারী ",j.female]})," / ",e.jsxs("span",{style:{color:"#1d4ed8"},children:["পুরুষ ",j.male]}),")"]})]})]}),e.jsxs("div",{className:"bis-field bis-r1b",children:[e.jsx("label",{className:"bis-label",children:"মিটিং ধরন *"}),e.jsx("select",{className:"bis-select",value:t.meetingType,onChange:c=>s({meetingType:c.target.value}),children:le.map(c=>e.jsx("option",{value:c,children:c},c))})]}),e.jsxs("div",{className:"bis-field bis-r2a",children:[e.jsx("label",{className:"bis-label",children:"স্থান *"}),e.jsx("input",{type:"text",className:"bis-input",value:t.venue,onChange:c=>s({venue:c.target.value}),placeholder:"কনফারেন্স রুম",list:"bis-venue-list",lang:"bn"}),e.jsx("datalist",{id:"bis-venue-list",children:ge.map(c=>e.jsx("option",{value:c},c))})]}),e.jsxs("div",{className:"bis-field bis-r2b",children:[e.jsx("label",{className:"bis-label",children:"মিটিং তারিখ *"}),e.jsx("input",{type:"date",className:"bis-input",value:t.meetingDate,onChange:c=>s({meetingDate:c.target.value})})]}),e.jsxs("div",{className:"bis-field bis-r2c",children:[e.jsx("label",{className:"bis-label",children:"শুরু *"}),e.jsxs("div",{style:{position:"relative"},children:[e.jsx("input",{type:"time",className:"bis-input",value:t.startTime,onChange:c=>{const b=c.target.value;s({startTime:b,endTime:he(b,2)})},style:{paddingRight:w?72:12}}),w&&e.jsx("span",{className:"bis-time-badge",style:{background:w.bg,color:w.color},children:w.text})]})]})]})]}),e.jsxs("div",{className:"bis-card",style:{marginTop:16},children:[e.jsxs("div",{className:"bis-card-header",children:[e.jsx("i",{className:"ti ti-list-check","aria-hidden":"true"}),e.jsx("span",{children:"আলোচ্যসূচি"}),e.jsxs("button",{className:"bis-add-btn",onClick:p,children:[e.jsx("i",{className:"ti ti-plus","aria-hidden":"true"})," যোগ করুন"]})]}),e.jsxs("table",{className:"bis-ag-table",children:[e.jsxs("colgroup",{children:[e.jsx("col",{style:{width:52}}),e.jsx("col",{}),e.jsx("col",{style:{width:44}})]}),e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"ক্রম"}),e.jsx("th",{style:{textAlign:"left"},children:"আলোচ্যসূচি"}),e.jsx("th",{})]})}),e.jsxs("tbody",{children:[t.agendaItems.length===0&&e.jsx("tr",{children:e.jsx("td",{colSpan:3,className:"bis-ag-empty",children:"কোনো আলোচ্যসূচি নেই — উপরে + যোগ করুন চাপুন"})}),t.agendaItems.map((c,b)=>e.jsxs("tr",{children:[e.jsx("td",{className:"bis-ag-sl",children:fe(b+1).padStart(2,"০")}),e.jsx("td",{className:"bis-ag-topic",children:e.jsx("input",{type:"text",className:"bis-ag-input",value:c.topic,onChange:l=>a(c.id,l.target.value),placeholder:"আলোচ্যসূচি লিখুন...",lang:"bn"})}),e.jsx("td",{className:"bis-ag-del",children:e.jsx("button",{className:"bis-ag-del-btn",onClick:()=>m(c.id),title:"মুছুন",style:{WebkitAppearance:"none",backgroundColor:"#fef2f2",border:"1.5px solid #fca5a5",color:"#ef4444"},children:e.jsx("i",{className:"ti ti-x","aria-hidden":"true"})})})]},c.id))]})]})]}),e.jsx("style",{children:`
        .bis-wrap { width: 100%; display: flex; flex-direction: column; gap: 0; }

        .bis-card {
          background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;
        }
        .bis-card-header {
          display: flex; align-items: center; gap: 9px;
          padding: 13px 22px;
          background: #f8fafc; border-bottom: 1px solid #e2e8f0;
          font-size: 11.5px; font-weight: 700; color: #64748b;
          text-transform: uppercase; letter-spacing: 0.07em;
        }
        .bis-card-header i { font-size: 16px; color: #94a3b8; }

        /* ── Grid: 6-column base so rows can be 2-wide or 3-wide cleanly ── */
        .bis-body {
          padding: 22px;
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 18px;
        }

        /* Row 1: কমিটি (4 cols) + ধরন (2 cols) = 2 fields */
        .bis-r1a { grid-column: span 4; }
        .bis-r1b { grid-column: span 2; }

        /* Row 2: স্থান (2 cols) + তারিখ (2 cols) + শুরু (2 cols) = 3 fields */
        .bis-r2a { grid-column: span 2; }
        .bis-r2b { grid-column: span 2; }
        .bis-r2c { grid-column: span 2; }

        /* Tablet 640–1023px — 2 col */
        @media (min-width: 640px) and (max-width: 1023px) {
          .bis-body { grid-template-columns: 1fr 1fr; gap: 14px; padding: 18px; }
          .bis-r1a { grid-column: span 1; }
          .bis-r1b { grid-column: span 1; }
          .bis-r2a { grid-column: span 1; }
          .bis-r2b { grid-column: span 1; }
          .bis-r2c { grid-column: 1 / -1; }
        }

        /* Mobile <640px — 1 col */
        @media (max-width: 639px) {
          .bis-body { grid-template-columns: 1fr; gap: 12px; padding: 14px; }
          .bis-r1a, .bis-r1b, .bis-r2a, .bis-r2b, .bis-r2c { grid-column: 1; }
        }

        .bis-field { display: flex; flex-direction: column; gap: 6px; }

        .bis-label {
          font-size: 11px; font-weight: 700;
          color: #64748b; letter-spacing: 0.5px; text-transform: uppercase;
        }

        .bis-input, .bis-select {
          width: 100%; padding: 10px 14px;
          font-size: 14px; font-family: inherit;
          border: 1px solid #e2e8f0; border-radius: 8px;
          background: #fff; color: #1e293b;
          outline: none; box-sizing: border-box;
          transition: border-color 0.14s, box-shadow 0.14s;
          min-height: 42px;
        }
        .bis-input:focus, .bis-select:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.08);
        }
        .bis-input::placeholder { color: #cbd5e1; }
        .bis-select { cursor: pointer; appearance: none; }

        .bis-time-badge {
          position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
          font-size: 10px; font-weight: 700; padding: 2px 9px; border-radius: 20px;
          pointer-events: none;
        }

        .bis-hint {
          font-size: 11.5px; color: #475569;
          background: #f8fafc; border: 1px solid #e2e8f0;
          border-radius: 6px; padding: 6px 11px;
          line-height: 1.5;
        }
        .bis-hint-green { background: #f0fdf4; border-color: #bbf7d0; color: #065f46; }

        /* ── Add button in card header ── */
        .bis-add-btn {
          margin-left: auto;
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 12px; font-size: 12px; font-weight: 600;
          background: #eff6ff; color: #1d4ed8;
          border: 1px solid #bfdbfe; border-radius: 6px;
          cursor: pointer; transition: background 0.12s; font-family: inherit;
          appearance: none;
        }
        .bis-add-btn:hover { background: #dbeafe; }
        .bis-add-btn i { font-size: 13px; }

        /* ── Agenda table ── */
        .bis-ag-table {
          width: 100%; border-collapse: collapse;
          font-size: 13px; table-layout: fixed;
        }
        .bis-ag-table th {
          background: #f8fafc; border: 1px solid #e2e8f0;
          padding: 8px 12px; font-size: 11px; font-weight: 700;
          color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;
          text-align: center;
        }
        .bis-ag-table td { border: 1px solid #e2e8f0; vertical-align: middle; }
        .bis-ag-sl {
          text-align: center; font-size: 12px;
          color: #94a3b8; font-weight: 700; padding: 8px 10px;
        }
        .bis-ag-topic { padding: 4px 6px; }
        .bis-ag-input {
          width: 100%; padding: 8px 10px;
          font-size: 13px; font-family: inherit;
          border: none; outline: none; background: transparent;
          color: #1e293b; box-sizing: border-box;
        }
        .bis-ag-input:focus {
          background: #f0f9ff;
          box-shadow: inset 0 0 0 1.5px #93c5fd;
          border-radius: 4px;
        }
        .bis-ag-input::placeholder { color: #cbd5e1; }
        .bis-ag-del { text-align: center; padding: 4px 8px; }
        /* Force red — override browser default button background */
        .bis-ag-del-btn {
          -webkit-appearance: none !important;
          appearance: none !important;
          width: 28px; height: 28px;
          display: inline-flex; align-items: center; justify-content: center;
          background-color: #fef2f2 !important;
          border: 1.5px solid #fca5a5 !important;
          border-radius: 6px;
          color: #ef4444 !important;
          cursor: pointer; font-size: 14px;
          transition: background-color 0.12s;
        }
        .bis-ag-del-btn:hover {
          background-color: #fee2e2 !important;
          border-color: #f87171 !important;
        }
        .bis-ag-empty {
          text-align: center; padding: 24px;
          color: #cbd5e1; font-size: 12.5px; font-style: italic;
        }
      `})]})}const je=D.memo(ye),F=()=>({id:I(),name:"",designation:"",department:"",email:"",attendanceStatus:"Present",committeeRole:"অতিথি"});function ve(t){const i=t.filter(s=>s.committeeRole!=="অতিথি"),n=t.filter(s=>s.committeeRole==="অতিথি");return{members:i,guests:n}}function L({status:t,onToggle:i}){const n=t==="Present";return e.jsxs("button",{type:"button",onClick:i,"aria-pressed":n,"aria-label":n?"উপস্থিত — পরিবর্তন করতে ক্লিক করুন":"অনুপস্থিত — পরিবর্তন করতে ক্লিক করুন",className:"ae-toggle",style:{color:n?"#15803d":"#dc2626"},children:[e.jsx("span",{className:"ae-toggle-box",style:n?{background:"#16a34a",borderColor:"#16a34a"}:{background:"#fff",borderColor:"#dc2626"},children:n&&e.jsx("svg",{width:"9",height:"9",viewBox:"0 0 16 16",fill:"none","aria-hidden":"true",children:e.jsx("path",{d:"M2 8.5L6 12.5L14 3.5",stroke:"white",strokeWidth:"2.4",strokeLinecap:"round",strokeLinejoin:"round"})})}),n?"উপস্থিত":"অনুপস্থিত"]})}function we({minutes:t,setMinutes:i}){const{members:n,guests:s}=ve(t.attendees);D.useEffect(()=>{t.attendees.length>0||i({...t,attendees:[F()]})},[]);const p=(r,g)=>{i({...t,attendees:t.attendees.map(h=>h.id===r?{...h,...g}:h)})},a=r=>{const g=t.attendees.find(h=>h.id===r);g&&p(r,{attendanceStatus:g.attendanceStatus==="Present"?"Absent":"Present"})},m=()=>{i({...t,attendees:[...t.attendees,F()]})},x=r=>{i({...t,attendees:t.attendees.filter(g=>g.id!==r)})};return e.jsxs("div",{className:"ae-wrap",children:[n.length>0&&e.jsxs("div",{className:"ae-card",children:[e.jsxs("div",{className:"ae-card-header",children:[e.jsx("i",{className:"ti ti-users","aria-hidden":"true"}),e.jsxs("span",{children:["কমিটি সদস্য (",n.length," জন)"]})]}),e.jsxs("table",{className:"ae-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{style:{width:44},children:"ক্রম"}),e.jsx("th",{style:{textAlign:"left"},children:"নাম"}),e.jsx("th",{style:{textAlign:"left"},children:"পদবি"}),e.jsx("th",{style:{textAlign:"left"},children:"বিভাগ / সেকশন"}),e.jsx("th",{style:{width:90},children:"ভূমিকা"}),e.jsx("th",{style:{width:130},children:"উপস্থিতি"})]})}),e.jsx("tbody",{children:n.map((r,g)=>e.jsxs("tr",{children:[e.jsx("td",{className:"ae-sl",children:g+1}),e.jsx("td",{children:r.name}),e.jsx("td",{children:r.designation}),e.jsx("td",{children:r.department}),e.jsx("td",{style:{textAlign:"center"},children:r.committeeRole||"—"}),e.jsx("td",{style:{textAlign:"center"},children:e.jsx(L,{status:r.attendanceStatus,onToggle:()=>r.id&&a(r.id)})})]},r.id??g))})]})]}),e.jsxs("div",{className:"ae-card",style:{marginTop:n.length>0?16:0},children:[e.jsxs("div",{className:"ae-card-header",children:[e.jsx("i",{className:"ti ti-user-plus","aria-hidden":"true"}),e.jsxs("span",{children:["অতিথি (",s.length," জন)"]}),e.jsxs("button",{type:"button",className:"ae-add-btn",onClick:m,children:[e.jsx("i",{className:"ti ti-plus","aria-hidden":"true"})," নতুন অতিথি যোগ করুন"]})]}),e.jsxs("table",{className:"ae-table",children:[e.jsxs("colgroup",{children:[e.jsx("col",{style:{width:44}}),e.jsx("col",{}),e.jsx("col",{}),e.jsx("col",{}),e.jsx("col",{style:{width:130}}),e.jsx("col",{style:{width:44}})]}),e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"ক্রম"}),e.jsx("th",{style:{textAlign:"left"},children:"নাম"}),e.jsx("th",{style:{textAlign:"left"},children:"পদবি"}),e.jsx("th",{style:{textAlign:"left"},children:"বিভাগ / প্রতিষ্ঠান"}),e.jsx("th",{children:"উপস্থিতি"}),e.jsx("th",{})]})}),e.jsxs("tbody",{children:[s.length===0&&e.jsx("tr",{children:e.jsx("td",{colSpan:6,className:"ae-empty",children:"কোনো অতিথি নেই — উপরে + নতুন অতিথি যোগ করুন চাপুন"})}),s.map((r,g)=>e.jsxs("tr",{children:[e.jsx("td",{className:"ae-sl",children:g+1}),e.jsx("td",{children:e.jsx("input",{type:"text",className:"ae-input",lang:"bn",value:r.name,placeholder:"অতিথির নাম",onChange:h=>r.id&&p(r.id,{name:h.target.value})})}),e.jsx("td",{children:e.jsx("input",{type:"text",className:"ae-input",lang:"bn",value:r.designation,placeholder:"পদবি",onChange:h=>r.id&&p(r.id,{designation:h.target.value})})}),e.jsx("td",{children:e.jsx("input",{type:"text",className:"ae-input",lang:"bn",value:r.department,placeholder:"বিভাগ / প্রতিষ্ঠানের নাম",onChange:h=>r.id&&p(r.id,{department:h.target.value})})}),e.jsx("td",{style:{textAlign:"center"},children:e.jsx(L,{status:r.attendanceStatus,onToggle:()=>r.id&&a(r.id)})}),e.jsx("td",{style:{textAlign:"center"},children:e.jsx("button",{type:"button",className:"ae-del-btn",onClick:()=>r.id&&x(r.id),title:"মুছুন","aria-label":"অতিথি মুছুন",children:e.jsx("i",{className:"ti ti-x","aria-hidden":"true"})})})]},r.id??g))]})]})]}),e.jsx("style",{children:`
        .ae-wrap { width: 100%; display: flex; flex-direction: column; gap: 0; }

        .ae-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
        .ae-card-header {
          display: flex; align-items: center; gap: 9px;
          padding: 13px 18px;
          background: #f8fafc; border-bottom: 1px solid #e2e8f0;
          font-size: 11.5px; font-weight: 700; color: #64748b;
          text-transform: uppercase; letter-spacing: 0.07em;
        }
        .ae-card-header i { font-size: 16px; color: #94a3b8; }

        .ae-add-btn {
          margin-left: auto;
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 12px; font-size: 12px; font-weight: 600;
          background: #eff6ff; color: #1d4ed8;
          border: 1px solid #bfdbfe; border-radius: 6px;
          cursor: pointer; transition: background 0.12s; font-family: inherit;
          appearance: none; text-transform: none; letter-spacing: normal;
        }
        .ae-add-btn:hover { background: #dbeafe; }
        .ae-add-btn i { font-size: 13px; }

        .ae-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .ae-table th {
          background: #f8fafc; border: 1px solid #e2e8f0;
          padding: 8px 10px; font-size: 11px; font-weight: 700;
          color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;
          text-align: center;
        }
        .ae-table td { border: 1px solid #e2e8f0; padding: 8px 10px; vertical-align: middle; color: #1e293b; }
        .ae-sl { text-align: center; font-size: 12px; color: #94a3b8; font-weight: 700; }
        .ae-empty { text-align: center; padding: 20px; color: #cbd5e1; font-size: 12.5px; font-style: italic; }

        .ae-input {
          width: 100%; padding: 7px 9px;
          font-size: 13px; font-family: inherit;
          border: 1px solid #e2e8f0; border-radius: 6px;
          background: #fff; color: #1e293b;
          outline: none; box-sizing: border-box;
          transition: border-color 0.14s, box-shadow 0.14s;
        }
        .ae-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.08); }
        .ae-input::placeholder { color: #cbd5e1; }

        .ae-toggle {
          display: inline-flex; align-items: center; gap: 6px;
          font-weight: 700; font-size: 12px; font-family: inherit;
          background: transparent; border: none; cursor: pointer; padding: 4px 2px;
        }
        .ae-toggle-box {
          width: 14px; height: 14px; border-radius: 3px; border: 1.5px solid;
          display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
        }

        .ae-del-btn {
          -webkit-appearance: none; appearance: none;
          width: 26px; height: 26px;
          display: inline-flex; align-items: center; justify-content: center;
          background-color: #fef2f2; border: 1.5px solid #fca5a5; border-radius: 6px;
          color: #ef4444; cursor: pointer; font-size: 13px;
          transition: background-color 0.12s;
        }
        .ae-del-btn:hover { background-color: #fee2e2; border-color: #f87171; }
      `})]})}const Ne="সম্মানিত উপস্থিত সকলকে স্বাগত জানিয়ে সভাপতি সভার কার্যক্রম শুরু করেন। তিনি সকলের উপস্থিতির জন্য ধন্যবাদ জ্ঞাপন করেন এবং আজকের সভার মূল আলোচ্যসূচি সম্পর্কে সংক্ষিপ্ত ধারণা প্রদান করেন।",Se="আলোচ্যসূচির সকল বিষয়ে আলোচনা সম্পন্ন হওয়ার পর সভাপতি উপস্থিত সকল সদস্যকে তাঁদের গঠনমূলক মতামত ও সক্রিয় অংশগ্রহণের জন্য ধন্যবাদ জানান। পরবর্তী সভার তারিখ ও সময় যথাসময়ে জানানো হবে মর্মে উল্লেখ করে তিনি সভার সমাপ্তি ঘোষণা করেন।";function ke({label:t,variant:i="orange"}){const s={default:{bg:"#f1f5f9",border:"#94a3b8",color:"#475569"},blue:{bg:"#eff6ff",border:"#3b82f6",color:"#1d4ed8"},green:{bg:"#f0fdf4",border:"#22c55e",color:"#065f46"},purple:{bg:"#faf5ff",border:"#a855f7",color:"#6b21a8"},orange:{bg:"#fff7ed",border:"#f97316",color:"#9a3412"}}[i];return e.jsx("div",{className:"ocs-block-title",style:{background:s.bg,borderLeftColor:s.border,color:s.color},children:t})}function O({label:t,variant:i,value:n,onChange:s,placeholder:p,template:a}){const m=()=>{s(n?`${n}

${a}`:a)};return e.jsxs("div",{className:"ocs-card",children:[e.jsxs("div",{className:"ocs-card-head",children:[e.jsx(ke,{label:t,variant:i}),e.jsx("button",{type:"button",className:"ocs-template-btn",onClick:m,children:"টেমপ্লেট যোগ করুন"})]}),e.jsx("textarea",{value:n,onChange:x=>s(x.target.value),className:"ocs-textarea",rows:9,placeholder:p,lang:"bn"})]})}function Ae({minutes:t,setMinutes:i}){return e.jsxs("div",{className:"ocs-wrap",children:[e.jsxs("div",{className:"ocs-grid",children:[e.jsx(O,{label:"উদ্বোধনী",variant:"orange",value:t.generalNotes,onChange:n=>i({...t,generalNotes:n}),placeholder:"সভার উদ্বোধনী বক্তব্য, প্রারম্ভিক মন্তব্য বা পর্যবেক্ষণ লিখুন...",template:Ne}),e.jsx(O,{label:"সমাপনী",variant:"blue",value:t.closingNotes,onChange:n=>i({...t,closingNotes:n}),placeholder:"সভার সমাপনী বক্তব্য বা সংক্ষিপ্ত উপসংহার লিখুন...",template:Se})]}),e.jsx("style",{children:`
        .ocs-wrap { width: 100%; }

        .ocs-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }

        .ocs-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
        }

        .ocs-card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 12px;
        }

        .ocs-block-title {
          display: inline-flex;
          align-items: center;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          padding: 4px 10px 4px 8px;
          border-left: 3px solid;
          border-radius: 0 5px 5px 0;
          margin: 0;
        }

        .ocs-template-btn {
          flex-shrink: 0;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 11px;
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
          border-radius: 6px;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.12s;
          white-space: nowrap;
        }
        .ocs-template-btn:hover { background: #dbeafe; }

        .ocs-textarea {
          width: 100%; padding: 12px 14px;
          font-size: 13px;
          border: 1px solid #e2e8f0;
          border-radius: 7px;
          background: #fff; color: #1e293b;
          outline: none; resize: vertical; min-height: 220px;
          line-height: 1.7;
          transition: border-color 0.14s, box-shadow 0.14s;
          box-sizing: border-box;
          font-family: inherit;
          flex: 1;
        }
        .ocs-textarea:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.08);
        }
        .ocs-textarea::placeholder { color: #cbd5e1; }

        /* Tablet — still side by side but tighter */
        @media (max-width: 1023px) and (min-width: 769px) {
          .ocs-card { padding: 16px; }
          .ocs-textarea { min-height: 190px; }
        }

        /* Mobile/narrow tablet — stack vertically, full width each */
        @media (max-width: 768px) {
          .ocs-grid { grid-template-columns: 1fr; gap: 14px; }
          .ocs-card { padding: 16px; border-radius: 10px; }
          .ocs-textarea { min-height: 180px; font-size: 13px; }
        }

        @media (max-width: 480px) {
          .ocs-card { padding: 12px; border-left: none; border-right: none; border-radius: 9px; }
          .ocs-card-head { flex-direction: column; align-items: flex-start; gap: 8px; }
          .ocs-template-btn { width: 100%; text-align: center; }
          .ocs-textarea { min-height: 150px; font-size: 14px; }
        }
      `})]})}const Te=D.memo(Ae),W={Pending:{label:"অপেক্ষমান",bg:"#fef9c3",color:"#a16207"},"In Progress":{label:"চলমান",bg:"#dbeafe",color:"#1d4ed8"},Completed:{label:"সম্পন্ন",bg:"#dcfce7",color:"#15803d"}};function De(t,i){if(!i)return[];const n=k.find(r=>r.name===t),s=n?[n]:k;let p;for(const r of s)if(p=r.committees.find(g=>g.name===i),p)break;if(!p)return[];const a=new Set,m=[],x=r=>{r&&!a.has(r)&&(a.add(r),m.push(r))};x(p.chairperson),x(p.secretary);for(const r of p.members??[])x(r.name);return m}function ze({minutes:t,setMinutes:i}){const n=De(t.organizationName,t.meetingTitle),s=(a,m,x)=>i({...t,agendaItems:t.agendaItems.map(r=>{if(r.id!==a)return r;const g=r.decisions[0]||{id:I(),description:"",madeBy:""};return{...r,decisions:[{...g,[m]:x}]}})}),p=(a,m,x)=>i({...t,agendaItems:t.agendaItems.map(r=>{if(r.id!==a)return r;const g=r.actionItems[0]||{id:I(),description:"",assignedTo:"",dueDate:"",priority:"Medium",status:"Pending"};return{...r,actionItems:[{...g,[m]:x}]}})});return t.agendaItems.length===0?e.jsxs("div",{className:"dd-empty",children:[e.jsx("p",{children:'কোনো আলোচ্যসূচি নেই। প্রথমে "আলোচ্যসূচি" ধাপে গিয়ে আইটেম যুক্ত করুন।'}),e.jsx("style",{children:".dd-empty { text-align: center; padding: 48px 16px; color: #94a3b8; font-size: 13px; }"})]}):e.jsxs("div",{className:"dd-wrap",children:[e.jsxs("table",{className:"dd-table",children:[e.jsxs("colgroup",{children:[e.jsx("col",{style:{width:"5%"}}),e.jsx("col",{style:{width:"25%"}}),e.jsx("col",{style:{width:"35%"}}),e.jsx("col",{style:{width:"13%"}}),e.jsx("col",{style:{width:"10%"}}),e.jsx("col",{style:{width:"12%"}})]}),e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"নং"}),e.jsx("th",{style:{textAlign:"left"},children:"আলোচ্যসূচি"}),e.jsx("th",{style:{textAlign:"left"},children:"আলোচনা ও সিদ্ধান্ত"}),e.jsx("th",{className:"dd-col-assignee",style:{textAlign:"left"},children:"দায়িত্ব"}),e.jsx("th",{className:"dd-col-due",children:"সময়সীমা"}),e.jsx("th",{children:"অবস্থা"})]})}),e.jsx("tbody",{children:t.agendaItems.map((a,m)=>{const x=a.decisions[0],r=a.actionItems[0];return e.jsxs("tr",{children:[e.jsx("td",{className:"dd-num","data-label":"ক্রম",children:m+1}),e.jsx("td",{className:"dd-readonly","data-label":"আলোচ্যসূচি",children:a.topic?e.jsx("div",{className:"dd-topic",children:a.topic}):e.jsx("span",{className:"dd-muted",children:"—"})}),e.jsx("td",{"data-label":"আলোচনা ও সিদ্ধান্ত",children:e.jsx("textarea",{value:x?.description??"",onChange:g=>s(a.id,"description",g.target.value),placeholder:"আলোচনা ও গৃহীত সিদ্ধান্ত লিখুন...",className:"dd-cell-input",rows:3,lang:"bn"})}),e.jsxs("td",{className:"dd-col-assignee","data-label":"দায়িত্ব",children:[e.jsx("input",{list:`dd-people-${a.id}`,value:r?.assignedTo??"",onChange:g=>p(a.id,"assignedTo",g.target.value),placeholder:"নাম / বিভাগ",className:"dd-cell-input",lang:"bn"}),e.jsx("datalist",{id:`dd-people-${a.id}`,children:n.map(g=>e.jsx("option",{value:g},g))})]}),e.jsx("td",{className:"dd-col-due","data-label":"সময়সীমা",children:e.jsx("input",{type:"date",value:r?.dueDate??"",onChange:g=>p(a.id,"dueDate",g.target.value),className:"dd-cell-input dd-date-input"})}),e.jsx("td",{"data-label":"অবস্থা",children:e.jsx("div",{className:"dd-status-group",children:de.map(g=>e.jsxs("label",{className:"dd-status-check",children:[e.jsx("input",{type:"checkbox",checked:r?.status===g,onChange:()=>{r?.status===g?i({...t,agendaItems:t.agendaItems.map(h=>h.id===a.id?{...h,actionItems:[]}:h)}):p(a.id,"status",g)}}),e.jsx("span",{style:{color:W[g].color},children:W[g].label})]},g))})})]},a.id)})})]}),e.jsx("style",{children:`
        .dd-wrap { width: 100%; overflow-x: auto; }

        /* ─── Desktop: full 6-col table ─── */
        .dd-table {
          width: 100%; border-collapse: collapse; font-size: 12.5px;
          border: 1.5px solid #cbd5e1; table-layout: fixed; min-width: 640px;
        }
        .dd-table th {
          background: #e5e7eb; border: 1px solid #cbd5e1;
          padding: 9px 10px; font-weight: 700; text-align: center; color: #1e293b;
          white-space: nowrap;
        }
        .dd-table td {
          border: 1px solid #cbd5e1; padding: 8px 8px; vertical-align: top;
        }
        .dd-num { text-align: center; font-weight: 700; color: #64748b; width: 44px; }
        .dd-readonly { background: #fafafa; }
        .dd-topic { font-weight: 600; font-size: 12.5px; color: #1e293b; line-height: 1.4; }
        .dd-muted { color: #cbd5e1; }

        .dd-cell-input {
          width: 100%; padding: 6px 8px; font-size: 12px; font-family: inherit;
          border: 1px solid #e2e8f0; border-radius: 5px;
          background: #fff; color: #1e293b; outline: none;
          box-sizing: border-box; resize: vertical; line-height: 1.5;
        }
        .dd-cell-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.1); }
        .dd-date-input { font-size: 11px; padding: 6px 4px; }

        .dd-status-group { display: flex; flex-direction: column; gap: 5px; }
        .dd-status-check {
          display: flex; align-items: center; gap: 6px;
          cursor: pointer; font-size: 11.5px; white-space: nowrap;
        }
        .dd-status-check input {
          width: 13px; height: 13px; cursor: pointer; accent-color: #1e40af; flex-shrink: 0;
        }

        /* ─── Tablet ≤768px: hide দায়িত্ব + সময়সীমা cols, stack status ─── */
        @media (max-width: 768px) {
          .dd-col-assignee, .dd-col-due { display: none; }
          .dd-table { min-width: 0; font-size: 12px; }
          .dd-table th, .dd-table td { padding: 7px 6px; }
        }

        /* ─── Mobile ≤480px: card layout, no table at all ─── */
        @media (max-width: 480px) {
          .dd-table, .dd-table thead, .dd-table tbody,
          .dd-table th, .dd-table td, .dd-table tr {
            display: block; width: 100%;
          }
          .dd-table thead { display: none; }
          .dd-table tr {
            border: 1px solid #cbd5e1; border-radius: 8px;
            margin-bottom: 12px; overflow: hidden; background: #fff;
          }
          .dd-table td {
            border: none; border-bottom: 1px solid #f1f5f9;
            padding: 10px 14px; font-size: 13px;
          }
          .dd-table td:last-child { border-bottom: none; }
          .dd-table td::before {
            content: attr(data-label);
            display: block; font-size: 10px; font-weight: 700;
            color: #94a3b8; text-transform: uppercase;
            letter-spacing: 0.05em; margin-bottom: 5px;
          }
          .dd-num { text-align: left; font-size: 11px; color: #94a3b8; }
          .dd-col-assignee, .dd-col-due { display: block; }
          .dd-status-group { flex-direction: row; flex-wrap: wrap; gap: 10px; }
          .dd-cell-input { font-size: 13px; padding: 8px 10px; }
        }
      `})]})}const Ie=D.memo(ze);function Be({minutes:t,setMinutes:i}){const[n,s]=D.useState(!1),p=D.useRef(null),a=1200,m=800,x=Array.isArray(t.meetingImage)?t.meetingImage:t.meetingImage?[t.meetingImage]:[],r=f=>new Promise(j=>{const w=new FileReader;w.onload=c=>{const b=new Image;b.onload=()=>{const l=p.current;if(!l)return;const d=l.getContext("2d",{alpha:!1});if(!d)return;l.width=a,l.height=m;const u=Math.max(a/b.width,m/b.height),A=a/2-b.width/2*u,N=m/2-b.height/2*u;d.fillStyle="#FFFFFF",d.fillRect(0,0,a,m),d.drawImage(b,A,N,b.width*u,b.height*u);const M=t.meetingDate||new Date().toISOString().split("T")[0],o=t.startTime||new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",hour12:!1}),y=`${M.split("-").reverse().join("/")} ${o}`;d.save(),d.font='bold 32px "Courier New", Courier, monospace',d.textAlign="right",d.shadowColor="rgba(0, 0, 0, 0.8)",d.shadowBlur=4,d.lineWidth=4,d.strokeStyle="rgba(0, 0, 0, 0.6)",d.strokeText(y,a-40,m-40),d.shadowBlur=0,d.fillStyle="#ff9800",d.fillText(y,a-40,m-40),d.restore(),j(l.toDataURL("image/jpeg",.85))},b.src=c.target?.result},w.readAsDataURL(f)}),g=async f=>{const j=f.target.files;if(!j||j.length===0)return;s(!0);const w=[];for(let c=0;c<j.length;c++){const b=await r(j[c]);w.push(b)}i({...t,meetingImage:[...x,...w]}),s(!1),f.target.value=""},h=f=>{const j=x.filter((w,c)=>c!==f);i({...t,meetingImage:j[0]??""})};return e.jsxs("div",{className:"w-full",children:[e.jsx("canvas",{ref:p,className:"hidden"}),e.jsx("div",{className:"bg-white rounded-2xl border border-slate-200 overflow-hidden",children:e.jsx("div",{className:"p-4 sm:p-6",children:e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6",children:[e.jsxs("div",{className:"sm:col-span-1 flex flex-row sm:flex-col gap-3",children:[e.jsxs("div",{className:"flex-1 p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-200",children:[e.jsxs("label",{className:"text-[11px] font-black text-slate-400 uppercase flex items-center gap-2 mb-2",children:[e.jsx(X,{"aria-hidden":"true"})," তারিখ ও সময়"]}),e.jsx("p",{className:"text-sm font-bold text-slate-700",children:t.meetingDate||"—"}),e.jsx("p",{className:"text-xs text-slate-500 font-medium",children:t.startTime||"—"})]}),e.jsx("input",{id:"multi-upload",type:"file",accept:"image/*",multiple:!0,onChange:g,className:"hidden"}),e.jsxs("label",{htmlFor:"multi-upload",className:"flex-1 flex flex-col items-center justify-center min-h-[100px] sm:min-h-[140px] border-2 border-dashed border-slate-200 rounded-2xl hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer group",children:[e.jsx("div",{className:"p-3 bg-white shadow-md rounded-full mb-2 group-hover:scale-110 transition-transform",children:e.jsx(ee,{className:"text-indigo-600"})}),e.jsx("span",{className:"text-xs font-bold text-slate-600",children:"ফটো যোগ করুন"}),e.jsx("span",{className:"text-[10px] text-slate-400 mt-1 uppercase font-bold",children:"একাধিক নির্বাচন"}),x.length>0&&e.jsxs("span",{className:"mt-1 text-[10px] font-bold text-indigo-500",children:[x.length," টি ফটো"]})]})]}),e.jsx("div",{className:"sm:col-span-3",children:x.length>0?e.jsxs("div",{className:"grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1",children:[x.map((f,j)=>e.jsxs("div",{className:"relative group rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50",children:[e.jsx("img",{src:f,alt:`Photo ${j+1}`,className:"w-full aspect-[3/2] object-cover"}),e.jsx("div",{className:"absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center",children:e.jsx("button",{onClick:()=>h(j),className:"p-3 bg-white text-rose-600 rounded-full shadow-xl hover:bg-rose-600 hover:text-white transition-all",children:e.jsx(te,{size:16})})}),e.jsxs("div",{className:"absolute top-2 left-2 px-2 py-0.5 bg-black/60 rounded text-[10px] text-white font-black",children:["#",j+1]})]},j)),n&&e.jsxs("div",{className:"w-full aspect-[3/2] bg-indigo-50 rounded-xl border-2 border-dashed border-indigo-200 flex flex-col items-center justify-center animate-pulse",children:[e.jsx("div",{className:"w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"}),e.jsx("p",{className:"text-[10px] font-black text-indigo-400 uppercase",children:"প্রক্রিয়াকরণ..."})]})]}):e.jsxs("div",{className:"w-full min-h-[220px] sm:min-h-[350px] bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300",children:[e.jsx(ie,{size:36,className:"opacity-20 mb-3"}),e.jsx("p",{className:"text-sm font-bold text-slate-400",children:"কোনো ফটো নেই"}),e.jsx("p",{className:"text-xs text-slate-300 mt-1",children:"বাম দিক থেকে ফটো যোগ করুন"})]})})]})})})]})}const z=t=>{if(t==null)return"";const i={0:"০",1:"১",2:"২",3:"৩",4:"৪",5:"৫",6:"৬",7:"৭",8:"৮",9:"৯"};return t.toString().replace(/\d/g,n=>i[n])},Me=["রবিবার","সোমবার","মঙ্গলবার","বুধবার","বৃহস্পতিবার","শুক্রবার","শনিবার"],Ce=["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"],$e=t=>{if(!t)return"";const i=new Date(t),n=Me[i.getDay()],s=z(String(i.getDate()).padStart(2,"0")),p=Ce[i.getMonth()],a=z(i.getFullYear());return`${n}, ${s} ${p} ${a}`},Pe=t=>({Present:"উপস্থিত",Absent:"অনুপস্থিত"})[t]??t;function He(t){const i=t.filter(s=>s.committeeRole!=="অতিথি"),n=t.filter(s=>s.committeeRole==="অতিথি");return{members:i,guests:n}}function _({rows:t}){return e.jsxs("table",{className:"pl-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{style:{width:"6%"},children:"ক্রম"}),e.jsx("th",{style:{width:"20%",textAlign:"left"},children:"নাম"}),e.jsx("th",{style:{width:"16%",textAlign:"left"},children:"পদবি"}),e.jsx("th",{style:{width:"18%",textAlign:"left"},children:"বিভাগ / সেকশন"}),e.jsx("th",{style:{width:"12%"},children:"কমিটিতে ভূমিকা"}),e.jsx("th",{style:{width:"12%"},children:"উপস্থিতি"}),e.jsx("th",{style:{width:"16%"},children:"স্বাক্ষর"})]})}),e.jsx("tbody",{children:t.map((i,n)=>e.jsxs("tr",{children:[e.jsx("td",{style:{textAlign:"center"},children:z(n+1)}),e.jsx("td",{children:i.name}),e.jsx("td",{children:i.designation}),e.jsx("td",{children:i.department}),e.jsx("td",{style:{textAlign:"center"},children:i.committeeRole||"—"}),e.jsx("td",{style:{textAlign:"center",fontWeight:600},children:i.name?Pe(i.attendanceStatus):""}),e.jsx("td",{})]},i.id??n))})]})}function Re({minutes:t}){const{members:i,guests:n}=He(t.attendees),s=K(i),p=t.attendees.length,a=p<=15?12:p<=22?11:p<=30?10:9,m=p<=15?9:p<=22?7:p<=30?5:4;return e.jsxs("div",{className:"pl-page",style:{"--pl-row-font":`${a}px`,"--pl-row-pad":`${m}px 8px`},children:[e.jsxs("div",{className:"pl-header",children:[e.jsx("h1",{className:"pl-org",children:t.organizationName}),t.organizationAddress&&e.jsx("p",{className:"pl-org-addr",children:t.organizationAddress}),e.jsx("h2",{className:"pl-title",children:(t.meetingTitle||"--")+" এর উপস্থিতি তালিকা"}),e.jsxs("p",{className:"pl-date",children:["তারিখ: ",$e(t.meetingDate)]})]}),e.jsxs("p",{className:"pl-summary",children:["মোট: ",z(s.total)," |  উপস্থিত: ",z(s.present)," |  অনুপস্থিত: ",z(s.absent)," |  উপস্থিতির হার: ",z(s.presentPercentage),"%"]}),i.length>0&&e.jsxs("div",{className:"pl-section",style:{marginBottom:n.length>0?"20px":"0"},children:[e.jsxs("p",{className:"pl-section-title",children:["কমিটি সদস্য (",z(i.length)," জন)"]}),e.jsx(_,{rows:i})]}),n.length>0&&e.jsxs("div",{className:"pl-section",children:[e.jsxs("p",{className:"pl-section-title",children:["অতিথি (",z(n.length)," জন)"]}),e.jsx(_,{rows:n})]}),e.jsx("style",{children:`
        ${Y}
        ${Z}

        .pl-page { max-width: 900px; margin: 0 auto; font-family: 'Noto Sans Bengali', Arial, sans-serif; }
        .pl-header { text-align: center; margin-bottom: 18px; }
        .pl-org { font-size: 18px; font-weight: 700; margin: 0; }
        .pl-org-addr { font-size: 12px; color: #475569; margin: 2px 0 10px; }
        .pl-title { font-size: 15px; font-weight: 700; margin: 10px 0 4px; border-bottom: 2px solid #000; display: inline-block; padding-bottom: 4px; }
        .pl-date { font-size: 12.5px; margin: 4px 0 0; }
        .pl-summary { font-size: 12px; font-weight: 600; margin-bottom: 12px; }
        .pl-section-title { font-size: 13px; font-weight: 700; margin: 0 0 6px; }
        .pl-table { width: 100%; border: 2px solid #000; border-collapse: collapse; font-size: var(--pl-row-font, 12px); }
        .pl-table th { border: 1px solid #000; padding: var(--pl-row-pad, 9px 8px); background: #e5e7eb; font-weight: 700; }
        .pl-table td { border: 1px solid #000; padding: var(--pl-row-pad, 9px 8px); line-height: 1.4; }

        @media print {
          /* Same ModuleShell overflow:hidden / narrow-column escape fix
             already applied in Printview.tsx and EmployeeNotice.tsx. */
          body * { visibility: hidden; }
          .pl-page, .pl-page * { visibility: visible; }
          .pl-page {
            position: absolute !important;
            top: 0 !important; left: 0 !important;
            max-width: none !important; width: 100% !important;
            background: white !important;
            page-break-inside: avoid; page-break-after: avoid;
          }
          html, body, body * { overflow: visible !important; }
        }
      `})]})}const v=t=>{if(t==null)return"";const i={0:"০",1:"১",2:"২",3:"৩",4:"৪",5:"৫",6:"৬",7:"৭",8:"৮",9:"৯"};return t.toString().replace(/\d/g,n=>i[n])},q=["রবিবার","সোমবার","মঙ্গলবার","বুধবার","বৃহস্পতিবার","শুক্রবার","শনিবার"],R=["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"],Ee=t=>{try{const i=new Date(t),n=v(i.getDate()),s=R[i.getMonth()],p=v(i.getFullYear());return`${n} ${s}, ${p}`}catch{return"[তারিখ]"}},$=t=>{if(!t)return"";const i=new Date(t),n=v(String(i.getDate()).padStart(2,"0")),s=R[i.getMonth()],p=v(i.getFullYear());return`${n} ${s} ${p}`},Fe=t=>{if(!t)return"";const i=new Date(t),n=q[i.getDay()],s=v(String(i.getDate()).padStart(2,"0")),p=R[i.getMonth()],a=v(i.getFullYear());return`${n}, ${s} ${p} ${a}`},G=t=>{if(!t)return"";const[i,n]=t.split(":"),p=parseInt(i)%12||12;return`${v(String(p).padStart(2,"0"))}:${v(n)}`},B=t=>{if(!t)return"";const i=parseInt(t.split(":")[0]);return i>=5&&i<12?"সকাল":i>=12&&i<15?"দুপুর":i>=15&&i<18?"বিকাল":i>=18&&i<20?"সন্ধ্যা":"রাত"},Le=t=>{if(!t)return"[সময়]";let[i,n]=t.split(":").map(Number);i=i%12||12;const s=n<10?`০${n}`:n;return v(`${i}:${s}`)},Oe=t=>t?t.replace(/(\d+)/g,i=>v(i)).replace("hours","ঘণ্টা").replace("hour","ঘণ্টা").replace("minutes","মিনিট").replace("minute","মিনিট"):"",We=t=>({Present:"উপস্থিত",Absent:"অনুপস্থিত",Excused:"অনুমতিপ্রাপ্ত",Late:"বিলম্বিত"})[t]??t,J=t=>!!t&&/[\u0980-\u09FFa-zA-Z0-9]/.test(t),U=t=>{if(!t)return"";const i=t.split(`
`);for(;i.length>0;){const n=i[i.length-1],s=n.trim()!==""&&!/[\u0980-\u09FFa-zA-Z0-9]/.test(n),p=n.trim()==="";if(s||p&&i.length>1)i.pop();else break}return i.join(`
`).trimEnd()};function _e(t){if(!t)return{male:0,female:0,total:0};const i=[];t.chairpersonGender&&i.push(t.chairpersonGender),t.secretaryGender&&i.push(t.secretaryGender);for(const p of t.members??[])p.gender&&i.push(p.gender);const n=i.filter(p=>p==="পুরুষ").length,s=i.filter(p=>p==="মহিলা").length;return{male:n,female:s,total:i.length}}const Ge=t=>t?Array.isArray(t)?t.filter(Boolean):typeof t=="string"&&t.length>0?[t]:[]:[];function Je({status:t}){const i=[{key:"Pending",label:"অপেক্ষমান"},{key:"In Progress",label:"চলমান"},{key:"Completed",label:"সম্পন্ন"}];return e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"6px"},children:i.map(n=>{const s=t===n.key;return e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"6px"},children:[e.jsx("div",{style:{width:"13px",height:"13px",border:"1.5px solid #333",borderRadius:"2px",backgroundColor:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}),e.jsx("span",{style:{fontSize:"11px",fontWeight:s?"bold":"normal",color:s?"#000":"#555",lineHeight:"1.3"},children:n.label})]},n.key)})})}function Ue({minutes:t}){const i=t.meetingDate?q[new Date(t.meetingDate).getDay()]:"[দিন]",n=t.meetingDate?Ee(t.meetingDate):"[তারিখ]",s=t.startTime?Le(t.startTime):"[সময়]",p={fontSize:"20px",lineHeight:"1.8",textAlign:"justify",margin:"0",fontWeight:"normal",color:"#000",paddingLeft:"0"};return e.jsxs("div",{style:{width:"100%",display:"flex",flexDirection:"column",gap:"24px"},children:[e.jsxs("p",{style:p,children:["এতদ্বারা ",t.organizationName||"[কারখানার নাম]"," এর ",t.meetingTitle||"[কমিটির নাম]"," -র সকল সদস্যগণের অবগতির জন্য জানানো যাচ্ছে যে, আগামী ",n," ইং তারিখ রোজ ",i," ",B(t.startTime)&&e.jsxs("span",{children:[B(t.startTime)," "]})," ",s," ঘটিকার সময় কারখানার অভ্যন্তরে ",t.venue||"[স্থান]"," এ একটি জরুরী আলোচনা সভা অনুষ্ঠিত হবে।"]}),e.jsxs("p",{style:p,children:["উক্ত সভায় ",t.meetingTitle||"[কমিটির নাম]"," -র সকল সদস্যগণকে যথা সময়ে নির্দিষ্ট স্থানে উপস্থিত থাকার জন্য বিশেষভাবে অনুরোধ করা হলো।"]})]})}function Ve({src:t,index:i}){return e.jsx("div",{style:{position:"relative",display:"block"},children:e.jsx("img",{src:t,alt:`মিটিং ছবি ${i+1}`,style:{width:"100%",height:"auto",maxHeight:"320px",border:"2px solid black",objectFit:"contain",display:"block"}})})}function V({minutes:t,printOption:i,viewSections:n,authorization:s}){const p=H(),a=K(t.attendees),m=ce(t.startTime,t.endTime),x=Ge(t.meetingImage),g=k.find(l=>l.name===t.organizationName)?.committees.find(l=>l.name===t.meetingTitle),h=_e(g),f=l=>{if(n)switch(l){case"basic":return n.basic;case"attendance":return n.attendance;case"agenda":return n.agenda;case"notice":return n.notice;case"approval":return n.approval;default:return!1}return i==="all"||i==="basic"&&(l==="basic"||l==="agenda")||i==="attendance"&&l==="attendance"||i==="agenda"&&l==="agenda"||i==="notice"&&l==="notice"},j=n?n.approval:i!=="notice"&&i!=="attendance",w=!!s&&(s.visibility.hrManager||s.visibility.factoryHead||s.visibility.hoHrHead||s.visibility.headOfOperations||!!(s.visibility?.president&&s.president)||!!(s.visibility?.secretary&&s.secretary)),c=[{label:"মিটিং ধরন",value:t.meetingType},{label:"তারিখ",value:Fe(t.meetingDate)},{label:"সময়",value:e.jsxs(e.Fragment,{children:[B(t.startTime)&&e.jsxs("span",{style:{fontWeight:"600"},children:[B(t.startTime)," "]}),G(t.startTime)," –"," ",B(t.endTime)&&e.jsxs("span",{style:{fontWeight:"600"},children:[B(t.endTime)," "]}),G(t.endTime),m&&` (মোট: ${Oe(m)})`]})},{label:"স্থান",value:t.venue},{label:"সভাপতি",value:t.chairperson},{label:"সচিব",value:t.secretary},...t.meetingEstablishDate?[{label:"কমিটি প্রতিষ্ঠার তারিখ",value:$(t.meetingEstablishDate)}]:[],...h.total>0?[{label:"মোট সদস্য",value:`নারী ${v(h.female)} জন (${v(Math.round(h.female/h.total*100))}%), পুরুষ ${v(h.male)} জন (${v(Math.round(h.male/h.total*100))}%), মোট ${v(h.total)} জন`}]:[],...t.meetingNumber?[{label:"রেফারেন্স নম্বর",value:t.meetingNumber}]:[]],b=(l=!1)=>{const d=s,u=p.authorities,A=[{show:!!(d&&d.visibility?.president&&d.president),name:d?.president??"",desig:d?.presidentDesignation??"সভাপতি",sub:t.meetingTitle,date:"",label:"--"},{show:!!(d&&d.visibility?.secretary&&d.secretary),name:d?.secretary??"",desig:d?.secretaryDesignation??"সচিব",sub:t.meetingTitle,date:"",label:"--"},{show:!!d?.visibility.hrManager,name:u.hrManager.name,desig:u.hrManager.designation,sub:"",date:"",label:"--"},{show:!!d?.visibility.factoryHead,name:u.factoryHead.name,desig:u.factoryHead.designation,sub:"",date:"",label:"কর্তৃপক্ষ ১"},{show:!!d?.visibility.hoHrHead,name:u.hoHrHead.name,desig:u.hoHrHead.designation,sub:"",date:"",label:"--"},{show:!!d?.visibility.headOfOperations,name:u.headOfOperations.name,desig:u.headOfOperations.designation,sub:"",date:"",label:"কর্তৃপক্ষ ২"}].filter(o=>o.show&&o.name),N=A.length,M=o=>N===1?"left":N===2?o===0?"left":"right":o===0?"left":o===N-1?"right":"center";return e.jsx("div",{style:{display:"flex",flexWrap:"wrap",justifyContent:N===1?"flex-start":"space-between",gap:"30px 15px",marginTop:"60px",width:"100%",pageBreakInside:"avoid"},children:A.map((o,y)=>e.jsxs("div",{style:{textAlign:M(y),flex:N===1?"0 1 250px":`0 1 calc(${100/N}% - 20px)`,minWidth:"180px",maxWidth:N===1?"250px":"300px"},children:[!l&&e.jsx("p",{style:{fontWeight:"bold",marginBottom:"8px",fontSize:"12px",color:"#333"},children:o.label}),e.jsx("div",{style:{height:l?"64px":"52px"}}),e.jsxs("div",{style:{borderTop:"2px solid black",paddingTop:"8px",width:"100%"},children:[e.jsx("p",{style:{fontWeight:"bold",fontSize:l?"20px":"18px",marginBottom:"2px",color:"#000"},children:o.name}),e.jsx("p",{style:{fontSize:l?"18px":"16px",color:"#444",marginBottom:o.sub?"1px":"3px"},children:o.desig}),o.sub&&e.jsx("p",{style:{fontSize:l?"16px":"14px",color:"#444",marginBottom:"3px"},children:o.sub}),!l&&e.jsxs("p",{style:{fontSize:"16px",color:"#666",whiteSpace:"nowrap"},children:["তারিখ: ",o.date?$(o.date):"___________"]})]})]},y))})};return e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"print-page",style:{padding:"0px",maxWidth:"210mm",margin:"0 auto",backgroundColor:"white",fontFamily:"'Noto Sans Bengali', Arial, sans-serif"},children:[e.jsxs("header",{className:"print-header",style:{textAlign:"center",borderBottom:"2px solid black",paddingBottom:"12px",marginBottom:"16px",pageBreakAfter:"avoid"},children:[e.jsx("h1",{style:{fontSize:"20px",fontWeight:"bold",color:"black",marginBottom:"4px",textTransform:"uppercase",letterSpacing:"0.5px",lineHeight:"1.2"},children:t.organizationName||"ORGANIZATION NAME"}),e.jsx("p",{style:{fontSize:"12px",color:"black",marginBottom:"0",lineHeight:"1.4"},children:t.organizationAddress||"Address"})]}),e.jsxs("main",{className:"print-body",style:{minHeight:"50vh"},children:[f("notice")&&e.jsxs("div",{className:"print-single-page",style:{marginBottom:"32px"},children:[e.jsx("div",{style:{textAlign:"center",marginBottom:"50px",pageBreakAfter:"avoid"},children:e.jsx("h3",{style:{fontSize:"30px",fontWeight:"bold",textDecoration:"underline",marginBottom:"4px",lineHeight:"1.3"},children:"অফিস নোটিশ"})}),e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:"30px",fontSize:"14px",fontWeight:"600",pageBreakAfter:"avoid"},children:[e.jsxs("div",{style:{lineHeight:"1.4"},children:["সূত্র: ",t.meetingNumber||"N/A"]}),e.jsxs("div",{style:{lineHeight:"1.4"},children:["তারিখ: ",$(t.meetingDate)]})]}),e.jsx("div",{style:{marginBottom:"24px"},children:e.jsx(Ue,{minutes:t})}),t.agendaItems.length>0&&(()=>{const l=t.agendaItems.length,d=l<=5?20:l<=8?17:l<=12?15:13,u=l<=5?1.8:l<=8?1.6:1.4;return e.jsxs("div",{style:{marginBottom:"32px",pageBreakInside:"avoid",marginTop:"10px"},children:[e.jsx("p",{style:{marginBottom:"15px",fontSize:"20px",lineHeight:"1.4",fontWeight:"normal",textDecoration:"underline",textUnderlineOffset:"5px"},children:"আলোচ্যসূচি:"}),e.jsx("ul",{style:{listStyleType:"disc",listStylePosition:"outside",fontSize:`${d}px`,lineHeight:u,margin:"0",padding:"0 0 0 25px"},children:t.agendaItems.map((A,N)=>e.jsx("li",{style:{marginBottom:"8px",fontStyle:"italic",fontWeight:"normal",textAlign:"justify"},children:A.topic||`বিষয় ${N+1}`},N))})]})})(),e.jsx("div",{style:{marginBottom:"20px"},children:e.jsx("p",{style:{fontSize:"20px",lineHeight:"1.4",margin:"0"},children:"ধন্যবাদান্তে,"})}),w&&e.jsx("div",{style:{marginTop:"64px",pageBreakInside:"avoid"},children:b(!0)})]}),!f("notice")&&(f("basic")||f("agenda")||f("attendance"))&&e.jsx("div",{style:{textAlign:"center",marginBottom:"20px",pageBreakAfter:"avoid"},children:e.jsx("h2",{style:{fontSize:"18px",fontWeight:"bold",marginBottom:"0",borderBottom:"2px solid black",display:"inline-block",paddingBottom:"4px",paddingLeft:"16px",paddingRight:"16px",lineHeight:"1.3"},children:(t.meetingTitle||"--")+" এর সভার কার্যবিবরণী"})}),f("basic")&&e.jsxs("div",{style:{marginBottom:"32px",pageBreakInside:"avoid"},children:[e.jsx("h3",{style:{fontWeight:"bold",borderBottom:"2px solid black",paddingBottom:"6px",marginBottom:"16px",fontSize:"15px",lineHeight:"1.3"},children:"সাধারণ তথ্য"}),e.jsx("table",{style:{width:"100%",fontSize:"13px",border:"2px solid black",borderCollapse:"collapse"},children:e.jsx("tbody",{children:c.map(({label:l,value:d},u)=>e.jsxs("tr",{style:u<c.length-1?{borderBottom:"1px solid black"}:{},children:[e.jsxs("td",{style:{fontWeight:"bold",padding:"10px",width:"35%",borderRight:"1px solid black",backgroundColor:"#f9fafb",lineHeight:"1.4"},children:[l,":"]}),e.jsx("td",{style:{padding:"10px",lineHeight:"1.4",fontWeight:l==="সভাপতি"||l==="সচিব"?"600":void 0},children:d})]},u))})}),x.length>0&&e.jsxs("div",{style:{marginTop:"20px",pageBreakInside:"avoid"},children:[e.jsx("h3",{style:{fontWeight:"bold",borderBottom:"2px solid black",paddingBottom:"6px",marginBottom:"16px",fontSize:"15px",lineHeight:"1.3"},children:"মিটিং ছবি"}),e.jsx("div",{style:{display:"grid",gridTemplateColumns:x.length===1?"1fr":"repeat(2, 1fr)",gap:"12px"},children:x.map((l,d)=>e.jsx(Ve,{src:l,index:d},d))})]}),J(t.generalNotes)&&e.jsxs("div",{style:{marginTop:"20px",pageBreakInside:"avoid"},children:[e.jsx("h3",{style:{fontWeight:"bold",borderBottom:"2px solid black",paddingBottom:"6px",marginBottom:"16px",fontSize:"15px",lineHeight:"1.3"},children:"সভার উদ্বোধনী"}),e.jsx("div",{style:{padding:"12px",border:"1px solid #ccc",borderRadius:"4px",backgroundColor:"#f9fafb",fontSize:"13px",lineHeight:"1.7",textAlign:"justify"},children:U(t.generalNotes)})]})]}),f("attendance")&&e.jsxs("div",{className:"print-single-page",style:{marginBottom:"32px",pageBreakInside:"avoid"},children:[e.jsx("h3",{style:{fontWeight:"bold",borderBottom:"2px solid black",paddingBottom:"6px",marginBottom:"16px",fontSize:"15px",lineHeight:"1.3"},children:"উপস্থিতি তালিকা"}),e.jsxs("p",{style:{fontSize:"12px",marginBottom:"12px",fontWeight:"600",lineHeight:"1.6"},children:["মোট: ",v(a.total)," |  উপস্থিত: ",v(a.present)," |  অনুপস্থিত: ",v(a.absent)," |  উপস্থিতির হার: ",v(a.presentPercentage),"%"]}),e.jsxs("table",{style:{width:"100%",border:"2px solid black",fontSize:"12px",borderCollapse:"collapse"},children:[e.jsx("thead",{children:e.jsx("tr",{style:{backgroundColor:"#e5e7eb"},children:["ক্রম","নাম","পদবি","বিভাগ / সেকশন","কমিটিতে ভূমিকা","উপস্থিতি","স্বাক্ষর"].map((l,d)=>e.jsx("th",{style:{border:"1px solid black",padding:"10px",textAlign:d===0||d>=4?"center":"left",fontWeight:"bold",lineHeight:"1.4",width:d===0?"50px":d===4?"90px":d===5?"100px":d===6?"140px":void 0},children:l},d))})}),e.jsx("tbody",{children:t.attendees.map((l,d)=>e.jsxs("tr",{children:[e.jsx("td",{style:{border:"1px solid black",padding:"10px",textAlign:"center",fontWeight:"600",lineHeight:"1.4"},children:v(d+1)}),e.jsx("td",{style:{border:"1px solid black",padding:"10px",lineHeight:"1.4"},children:l.name}),e.jsx("td",{style:{border:"1px solid black",padding:"10px",lineHeight:"1.4"},children:l.designation}),e.jsx("td",{style:{border:"1px solid black",padding:"10px",lineHeight:"1.4"},children:l.department}),e.jsx("td",{style:{border:"1px solid black",padding:"10px",textAlign:"center",lineHeight:"1.4"},children:l.committeeRole||"—"}),e.jsx("td",{style:{border:"1px solid black",padding:"10px",textAlign:"center",fontWeight:"600",lineHeight:"1.4"},children:We(l.attendanceStatus)}),e.jsx("td",{style:{border:"1px solid black",padding:"10px"}})]},d))})]})]}),f("agenda")&&t.agendaItems.length>0&&e.jsxs("div",{style:{marginBottom:"32px"},children:[e.jsx("h3",{style:{fontWeight:"bold",borderBottom:"2px solid black",paddingBottom:"6px",marginBottom:"16px",fontSize:"15px",lineHeight:"1.3"},children:"আলোচ্যসূচি ও সিদ্ধান্ত"}),e.jsxs("table",{style:{width:"100%",border:"2px solid black",borderCollapse:"collapse",fontSize:"12px",tableLayout:"fixed"},children:[e.jsxs("colgroup",{children:[e.jsx("col",{style:{width:"5%"}}),"   ",e.jsx("col",{style:{width:"25%"}}),"  ",e.jsx("col",{style:{width:"31%"}}),"  ",e.jsx("col",{style:{width:"15%"}}),"  ",e.jsx("col",{style:{width:"11%"}}),"  ",e.jsx("col",{style:{width:"13%"}}),"  "]}),e.jsx("thead",{children:e.jsx("tr",{style:{backgroundColor:"#e5e7eb"},children:[{title:"নং",align:"center"},{title:"আলোচ্যসূচি",align:"left"},{title:"আলোচনা ও সিদ্ধান্ত",align:"left"},{title:"দায়িত্ব",align:"left"},{title:"সময়সীমা",align:"center"},{title:"অবস্থা",align:"center"}].map((l,d)=>e.jsx("th",{style:{border:"1px solid black",padding:l.align==="center"?"9px 8px":"9px 10px",textAlign:l.align,fontWeight:"bold",lineHeight:1.5,verticalAlign:"middle"},children:l.title},d))})}),e.jsx("tbody",{children:t.agendaItems.map((l,d)=>{const u=l.decisions[0],A=l.actionItems[0];return e.jsxs("tr",{style:{backgroundColor:d%2===0?"#ffffff":"#fafafa",pageBreakInside:"avoid"},children:[e.jsx("td",{style:{border:"1px solid black",padding:"10px 8px",textAlign:"center",fontWeight:"bold",fontSize:"13px",verticalAlign:"top",lineHeight:"1.4"},children:v(String(d+1).padStart(2,"0"))}),e.jsx("td",{style:{border:"1px solid black",padding:"10px",verticalAlign:"top",lineHeight:"1.7"},children:l.topic?e.jsx("div",{style:{fontWeight:"bold",fontSize:"12px"},children:l.topic}):e.jsx("span",{style:{color:"#aaa"},children:"—"})}),e.jsx("td",{style:{border:"1px solid black",padding:"10px",verticalAlign:"top",lineHeight:"1.7"},children:u?.description?e.jsx("div",{style:{fontSize:"11px",textAlign:"justify"},children:u.description}):e.jsx("span",{style:{color:"#aaa"},children:"—"})}),e.jsx("td",{style:{border:"1px solid black",padding:"10px",verticalAlign:"top",fontSize:"11px",lineHeight:"1.6"},children:A?.assignedTo||e.jsx("span",{style:{color:"#aaa"},children:"—"})}),e.jsx("td",{style:{border:"1px solid black",padding:"10px",verticalAlign:"top",fontSize:"11px",lineHeight:"1.6",textAlign:"center"},children:A?.dueDate?$(A.dueDate):e.jsx("span",{style:{color:"#aaa"},children:"—"})}),e.jsx("td",{style:{border:"1px solid black",padding:"10px",verticalAlign:"top"},children:e.jsx(Je,{status:A?.status??""})})]},d)})})]})]}),f("agenda")&&J(t.closingNotes)&&e.jsxs("div",{style:{marginTop:"24px",pageBreakInside:"avoid"},children:[e.jsx("h3",{style:{fontWeight:"bold",borderBottom:"2px solid black",paddingBottom:"6px",marginBottom:"16px",fontSize:"15px",lineHeight:"1.3"},children:"সভার সমাপনী"}),e.jsx("div",{style:{padding:"12px",border:"1px solid #ccc",borderRadius:"4px",backgroundColor:"#f9fafb",fontSize:"13px",lineHeight:"1.7",textAlign:"justify"},children:U(t.closingNotes)})]})]}),j&&w&&e.jsx("footer",{className:"print-footer",style:{marginTop:"8px",paddingTop:"4px",pageBreakInside:"avoid"},children:b(!1)})]}),e.jsx("style",{children:`
        @media print {
          @page { size: A4 portrait; margin: 19mm; }
          html, body { background: white !important; margin: 0 !important; padding: 0 !important; font-family: 'Noto Sans Bengali', Arial, sans-serif !important; }

          /* ModuleShell renders this content inside a narrow, constrained
             grid column with overflow:hidden on several ancestors. Without
             this escape mechanism the printed output shrinks into that
             narrow column instead of using the full A4 page — same root
             cause already fixed in EmployeeNotice.tsx / Envelope.tsx. */
          body * { visibility: hidden; }
          .print-page, .print-page * { visibility: visible; }
          .print-page {
            position: absolute !important;
            top: 0 !important; left: 0 !important;
            width: 100% !important; max-width: 100% !important;
            background: white !important; padding: 0 !important;
          }
          html, body, body * { overflow: visible !important; }

          footer:not(.print-footer), .app-footer, .page-footer, .developer-footer, .copyright-footer,
          [class*="copyright"], [class*="developer"], [class*="technology"], [class*="powered"], [class*="credit"],
          div[class*="footer"]:not(.print-footer), div[id*="footer"]:not(.print-footer) {
            display: none !important; visibility: hidden !important; opacity: 0 !important; height: 0 !important; overflow: hidden !important;
          }
          table th { background-color: #e5e7eb !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          table, th, td { border-color: black !important; }
          p, li, td, th { orphans: 3; widows: 3; }
          h1, h2, h3, h4, h5, h6 { page-break-after: avoid; orphans: 4; widows: 4; }
          tr { page-break-inside: avoid; }

          /* Notice and Attendance/Participant List must always fit on a
             single printed page — keep the whole block together rather
             than letting it spill onto a second page. */
          .print-single-page {
            page-break-inside: avoid;
            page-break-after: avoid;
            page-break-before: avoid;
          }
        }
      `})]})}const Ye=[{id:"basic",label:"প্রাথমিক তথ্য",icon:"ti-building"},{id:"attendance",label:"উপস্থিতি নিশ্চিতকরণ",icon:"ti-users"},{id:"opening",label:"উদ্বোধনী ও সমাপনী",icon:"ti-microphone"},{id:"discussion",label:"আলোচনা ও সিদ্ধান্ত",icon:"ti-table"},{id:"photo",label:"সভার ছবি",icon:"ti-photo"}];function tt(){const{user:t}=ne(),i=H(),n=re("meetings",i.id,t?.name??"unknown"),[s,p]=D.useState(E),[a,m]=D.useState(P),[x,r]=D.useState("basic"),g=D.useRef(null),h=x!=="basic"&&x!=="attendance"&&x!=="opening"&&x!=="discussion"&&x!=="photo",f=x==="basic"||x==="attendance"||x==="opening"||x==="discussion"||x==="photo"?x:"basic",j=o=>{const T=(k.find(S=>S.name===o.organizationName)?.committees??k.flatMap(S=>S.committees)).find(S=>S.name===o.meetingTitle);T&&p(S=>({...S,president:T.chairperson,presidentDesignation:T.chairpersonDesignation??"সভাপতি",secretary:T.secretary,secretaryDesignation:T.secretaryDesignation??"সচিব",visibility:{...S.visibility,president:!0,secretary:!0}}))},w=o=>{m(o),j(o)},c=()=>{n.setEditingId(null),m(P),p(E),r("basic")},b=()=>window.print(),l=async()=>{const o=g.current;if(!o)return;const y=await ae(o,{scale:2,useCORS:!0}),T=y.toDataURL("image/png"),S=new se("p","mm","a4"),C=S.internal.pageSize.getWidth(),Q=y.height*C/y.width;S.addImage(T,"PNG",0,0,C,Q),S.save(`Meeting_Minutes_${a.meetingTitle||"document"}.pdf`)},d=o=>{const y=o.split(`
`);for(;y.length>0;){const T=y[y.length-1],S=T.trim()!==""&&!/[\u0980-\u09FFa-zA-Z0-9]/.test(T),C=T.trim()==="";if(S||C&&y.length>1)y.pop();else break}return y.join(`
`).trimEnd()},u=()=>({organizationName:a.organizationName,organizationAddress:a.organizationAddress,department:a.department,meetingTitle:a.meetingTitle,meetingEstablishDate:a.meetingEstablishDate,meetingType:a.meetingType,meetingNumber:a.meetingNumber,noticeDate:a.noticeDate,meetingDate:a.meetingDate,startTime:a.startTime,endTime:a.endTime,venue:a.venue,virtualMeetingLink:a.virtualMeetingLink,meetingImage:a.meetingImage,chairperson:a.chairperson,secretary:a.secretary,attendeesJson:JSON.stringify(a.attendees??[]),previousMinutesReference:a.previousMinutesReference,previousMinutesApproval:a.previousMinutesApproval,previousMinutesRejectionDetails:a.previousMinutesRejectionDetails,agendaJson:JSON.stringify(a.agendaItems??[]),generalNotes:d(a.generalNotes),closingNotes:d(a.closingNotes),annexuresJson:JSON.stringify(a.annexures??[]),nextMeetingDate:a.nextMeetingDate,nextMeetingTime:a.nextMeetingTime,nextMeetingVenue:a.nextMeetingVenue,authorizationJson:JSON.stringify(s),distributionJson:JSON.stringify(a.distributionList??[])}),A=o=>({...P,organizationName:String(o.organizationName??""),organizationAddress:String(o.organizationAddress??""),department:String(o.department??""),meetingTitle:String(o.meetingTitle??""),meetingEstablishDate:String(o.meetingEstablishDate??""),meetingType:String(o.meetingType??"মাসিক"),meetingNumber:String(o.meetingNumber??""),noticeDate:String(o.noticeDate??""),meetingDate:String(o.meetingDate??""),startTime:String(o.startTime??""),endTime:String(o.endTime??""),venue:String(o.venue??""),virtualMeetingLink:String(o.virtualMeetingLink??""),meetingImage:String(o.meetingImage??""),chairperson:String(o.chairperson??""),secretary:String(o.secretary??""),attendees:(()=>{try{return JSON.parse(String(o.attendeesJson??"[]"))}catch{return[]}})(),previousMinutesReference:String(o.previousMinutesReference??""),previousMinutesApproval:String(o.previousMinutesApproval??"N/A"),previousMinutesRejectionDetails:String(o.previousMinutesRejectionDetails??""),agendaItems:(()=>{try{return JSON.parse(String(o.agendaJson??"[]"))}catch{return[]}})(),generalNotes:String(o.generalNotes??""),closingNotes:String(o.closingNotes??""),annexures:(()=>{try{return JSON.parse(String(o.annexuresJson??"[]"))}catch{return[]}})(),nextMeetingDate:String(o.nextMeetingDate??""),nextMeetingTime:String(o.nextMeetingTime??""),nextMeetingVenue:String(o.nextMeetingVenue??""),distributionList:(()=>{try{return JSON.parse(String(o.distributionJson??"[]"))}catch{return[]}})()}),N=o=>{n.setEditingId(String(o.id??"")),m(A(o));try{const y=JSON.parse(String(o.authorizationJson??""));y&&p(y)}catch{}r("basic")},M=[{label:"নোটিশ",onClick:()=>r("notice")},{label:"সভার কার্যবিবরণী",onClick:()=>r("minutes")},{label:"উপস্থিতি তালিকা",onClick:()=>r("participants")}];return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`${Y}${Z}`}),e.jsxs(oe,{moduleName:"সভার কার্যবিবরণী",moduleNameEn:"Meeting Minutes",date:a.meetingDate,onDateChange:o=>w({...a,meetingDate:o}),steps:Ye,activeStep:f,onStepChange:o=>r(o),billItems:M,isBillActive:h,onSave:async()=>{const o=u(),y=n.editingId?await n.update(n.editingId,o):await n.save(o);return y&&c(),y},isSaving:n.isSaving,configured:n.configured,adapterName:n.adapterName,saveDisabled:!a.meetingTitle,editingId:n.editingId,onCancelEdit:c,onReset:c,onUpdate:N,updateModule:"meetings",updateLabel:"মিটিং রেকর্ড খুঁজুন",updateSearchPlaceholder:"মিটিং শিরোনাম দিয়ে খুঁজুন...",records:n.records,isLoading:n.isLoading,onLoadRecord:o=>N(o),onDeleteRecord:n.remove,onReload:n.reload,recordLabel:o=>String(o.meetingTitle??o.id??"—"),auth:s,onAuthChange:p,onPrint:b,onPDF:l,lang:"bn",children:[x==="basic"&&e.jsx(je,{minutes:a,setMinutes:w}),x==="attendance"&&e.jsx(we,{minutes:a,setMinutes:m}),x==="opening"&&e.jsx(Te,{minutes:a,setMinutes:m}),x==="discussion"&&e.jsx(Ie,{minutes:a,setMinutes:m}),x==="photo"&&e.jsx(Be,{minutes:a,setMinutes:m}),x==="notice"&&e.jsx("div",{id:"printable-area",ref:g,children:e.jsx(V,{minutes:a,printOption:"notice",authorization:s})}),x==="minutes"&&e.jsx("div",{id:"printable-area",ref:g,children:e.jsx(V,{minutes:a,authorization:s,viewSections:{basic:!0,agenda:!0,attendance:!1,notice:!1,approval:!0}})}),x==="participants"&&e.jsx("div",{id:"printable-area",ref:g,children:e.jsx(Re,{minutes:a})})]})]})}export{tt as default};
