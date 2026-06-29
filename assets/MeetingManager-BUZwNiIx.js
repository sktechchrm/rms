import{K as T,r as I,u as W,j as e,L as ae,M as se,N as re,O as oe,a as le,G as de,H as ce}from"./index-BQ__uZVW.js";import{B as Q,P as X,u as pe}from"./printCSS-0BD7teNE.js";import{D as G,M as ge}from"./ModuleShell-cOQa4zUy.js";import"./DatabaseFactory-QVpYkwPB.js";import"./AuthorityIconButton-BUgJjk7Z.js";import"./DataUseCases-BbMj8eYQ.js";const xe=["মাসিক","দ্বি-মাসিক","ত্রৈমাসিক","অর্ধ-বার্ষিক","বার্ষিক","বিশেষ","অত্যাবশ্যক","বোর্ড","কমিটি","প্রকল্প","দল","অন্যান্য"],he=["Pending","In Progress","Completed"];T.map(t=>({id:t.id,name:t.name,address:t.address}));T.flatMap(t=>t.committees.map(i=>({id:`${t.id}__${i.id}`,name:i.name,chairperson:i.chairperson,secretary:i.secretary})));const F={organizationName:"",organizationAddress:"",department:"",meetingTitle:"",meetingEstablishDate:"",meetingType:"মাসিক",meetingNumber:"",noticeDate:new Date().toISOString().split("T")[0],meetingDate:new Date().toISOString().split("T")[0],startTime:"",endTime:"",venue:"",virtualMeetingLink:"",meetingImage:"",chairperson:"",secretary:"",attendees:[],previousMinutesReference:"",previousMinutesApproval:"N/A",previousMinutesRejectionDetails:"",agendaItems:[],generalNotes:"",closingNotes:"",annexures:[],nextMeetingDate:"",nextMeetingTime:"",nextMeetingVenue:"",preparedBy:"",preparedByDesignation:"",preparedDate:new Date().toISOString().split("T")[0],reviewedBy:"",reviewedByDesignation:"",reviewedDate:"",approvedBy:"",approvedByDesignation:"",approvedDate:"",authority1:"",authority1Designation:"কারখানা প্রধান",authority1Date:"",authority2:"",authority2Designation:"ব্যবস্থাপক (মানবসম্পদ, প্রশাসন ও সম্মতি)",authority2Date:"",showPreparedBy:!0,showReviewedBy:!0,showApprovedBy:!0,showAuthority1:!0,showAuthority2:!0,distributionList:[]},me=(t,i)=>{if(!t||!i)return"";const[n,s]=t.split(":").map(Number),[l,c]=i.split(":").map(Number);let g=n*60+s,b=l*60+c;b<g&&(b+=1440);const x=b-g;if(x<=0)return"";const a=Math.floor(x/60),f=x%60;return a>0&&f>0?`${a} hour${a>1?"s":""} ${f} minute${f>1?"s":""}`:a>0?`${a} hour${a>1?"s":""}`:`${f} minute${f>1?"s":""}`},M=()=>`${Date.now()}-${Math.random().toString(36).substr(2,9)}`,ee=t=>{const i=t.filter(c=>c.attendanceStatus==="Present").length,n=t.filter(c=>c.attendanceStatus==="Absent").length,s=t.length,l=s>0?Math.round(i/s*100):0;return{present:i,absent:n,total:s,presentPercentage:l}},be=(t="MIN")=>{const i=new Date().getFullYear(),n=Math.floor(Math.random()*1e3).toString().padStart(3,"0");return`${t}-${i}-${n}`},fe=["কনফারেন্স রুম","কনফারেন্স হল","বোর্ড রুম","ট্রেনিং রুম","ডাইনিং হল","কারখানার প্রধান কক্ষ","মিটিং রুম","অডিটোরিয়াম"];function ue(t){if(!t)return{male:0,female:0,total:0};const i=[];t.chairpersonGender&&i.push(t.chairpersonGender),t.secretaryGender&&i.push(t.secretaryGender);for(const n of t.members??[])n.gender&&i.push(n.gender);return{male:i.filter(n=>n==="পুরুষ").length,female:i.filter(n=>n==="মহিলা").length,total:i.length}}function ye(t,i){if(!t)return"";const[n,s]=t.split(":").map(Number),l=(n+i)%24;return`${String(l).padStart(2,"0")}:${String(s).padStart(2,"0")}`}function je(t){return t?parseInt(t.split(":")[0])>=12?{text:"বিকাল",bg:"#e0e7ff",color:"#4338ca"}:{text:"সকাল",bg:"#fef3c7",color:"#92400e"}:null}const ve=["০","১","২","৩","৪","৫","৬","৭","৮","৯"];function E(t){return String(t).split("").map(i=>ve[parseInt(i)]??i).join("")}function we(t){return{id:M(),itemNumber:String(t),topic:"",presenter:"",timeAllocated:"",discussion:"",decisions:[],actionItems:[]}}function Ne({minutes:t,setMinutes:i}){const n=W();I.useEffect(()=>{const o=T.find(u=>u.id===n.id)??T[0];o&&i({...t,organizationName:o.name,organizationAddress:o.address})},[n.id]);const s=o=>i({...t,...o}),l=()=>s({agendaItems:[...t.agendaItems,we(t.agendaItems.length+1)]}),c=(o,u)=>s({agendaItems:t.agendaItems.map(r=>r.id===o?{...r,topic:u}:r)}),g=o=>s({agendaItems:t.agendaItems.filter(u=>u.id!==o).map((u,r)=>({...u,itemNumber:String(r+1)}))}),b=o=>{const r=((T.find(d=>d.name===t.organizationName)??T[0])?.committees??T.flatMap(d=>d.committees)).find(d=>d.id===o);r&&s({meetingTitle:r.name,meetingEstablishDate:r.establishDate??t.meetingEstablishDate,meetingNumber:be(),chairperson:r.chairperson,secretary:r.secretary,attendees:x(r)})},x=o=>{const u=[{id:M(),name:o.chairperson,designation:o.chairpersonDesignation??"",department:o.chairpersonDept??"",email:"",attendanceStatus:"Present",committeeRole:"সভাপতি"},{id:M(),name:o.secretary,designation:o.secretaryDesignation??"",department:o.secretaryDept??"",email:"",attendanceStatus:"Present",committeeRole:"সচিব"},...(o.members??[]).map(j=>({id:M(),name:j.name,designation:j.designation,department:j.section,email:"",attendanceStatus:"Present",committeeRole:j.role||"সদস্য"}))],r=Array.from({length:5},()=>({id:M(),name:"",designation:"",department:"",email:"",attendanceStatus:"Present",committeeRole:"অতিথি"})),d={সভাপতি:0,সচিব:1,"সহ-সভাপতি":2};return[...[...u].sort((j,k)=>{const z=d[j.committeeRole??""]??3,v=d[k.committeeRole??""]??3;return z-v}),...r]},a=T.find(o=>o.name===t.organizationName),f=a?a.committees:T.flatMap(o=>o.committees),h=f.find(o=>o.name===t.meetingTitle),y=ue(h),S=je(t.startTime);return e.jsxs("div",{className:"bis-wrap",children:[e.jsxs("div",{className:"bis-card",children:[e.jsxs("div",{className:"bis-card-header",children:[e.jsx("i",{className:"ti ti-calendar-event","aria-hidden":"true"}),e.jsx("span",{children:"মিটিং সময়সূচি"})]}),e.jsxs("div",{className:"bis-body",children:[e.jsxs("div",{className:"bis-field bis-r1a",children:[e.jsx("label",{className:"bis-label",htmlFor:"bis-committee",children:"কমিটি নির্বাচন *"}),e.jsxs("select",{id:"bis-committee",className:"bis-select",value:f.find(o=>o.name===t.meetingTitle)?.id??"",onChange:o=>b(o.target.value),"aria-required":!0,children:[e.jsx("option",{value:"",children:"— কমিটি নির্বাচন করুন —"}),f.map(o=>e.jsx("option",{value:o.id,children:o.name},o.id))]}),h&&e.jsxs("p",{className:"bis-hint bis-hint-green",children:["✓ সভাপতি: ",h.chairperson," · সচিব: ",h.secretary,y.total>0&&e.jsxs("span",{children:[" · মোট ",y.total," জন (",e.jsxs("span",{style:{color:"#db2777"},children:["নারী ",y.female]})," / ",e.jsxs("span",{style:{color:"#1d4ed8"},children:["পুরুষ ",y.male]}),")"]})]})]}),e.jsxs("div",{className:"bis-field bis-r1b",children:[e.jsx("label",{className:"bis-label",htmlFor:"bis-meeting-type",children:"মিটিং ধরন *"}),e.jsx("select",{id:"bis-meeting-type",className:"bis-select",value:t.meetingType,onChange:o=>s({meetingType:o.target.value}),"aria-required":!0,children:xe.map(o=>e.jsx("option",{value:o,children:o},o))})]}),e.jsxs("div",{className:"bis-field bis-r2a",children:[e.jsx("label",{className:"bis-label",htmlFor:"bis-venue",children:"স্থান *"}),e.jsx("input",{id:"bis-venue",type:"text",className:"bis-input",value:t.venue,onChange:o=>s({venue:o.target.value}),placeholder:"কনফারেন্স রুম",list:"bis-venue-list","aria-required":!0,lang:"bn"}),e.jsx("datalist",{id:"bis-venue-list",children:fe.map(o=>e.jsx("option",{value:o},o))})]}),e.jsxs("div",{className:"bis-field bis-r2b",children:[e.jsx("label",{className:"bis-label",htmlFor:"bis-meeting-date",children:"মিটিং তারিখ *"}),e.jsx("input",{id:"bis-meeting-date",type:"date",className:"bis-input",value:t.meetingDate,onChange:o=>s({meetingDate:o.target.value}),"aria-required":!0})]}),e.jsxs("div",{className:"bis-field bis-r2c",children:[e.jsx("label",{className:"bis-label",htmlFor:"bis-start-time",children:"শুরু *"}),e.jsxs("div",{style:{position:"relative"},children:[e.jsx("input",{id:"bis-start-time",type:"time",className:"bis-input",value:t.startTime,"aria-required":!0,onChange:o=>{const u=o.target.value;s({startTime:u,endTime:ye(u,3)})},style:{paddingRight:S?72:12}}),S&&e.jsx("span",{className:"bis-time-badge",style:{background:S.bg,color:S.color},children:S.text})]})]})]})]}),e.jsxs("div",{className:"bis-card",style:{marginTop:16},children:[e.jsxs("div",{className:"bis-card-header",children:[e.jsx("i",{className:"ti ti-list-check","aria-hidden":"true"}),e.jsx("span",{children:"আলোচ্যসূচি"}),e.jsxs("button",{className:"bis-add-btn",onClick:l,children:[e.jsx("i",{className:"ti ti-plus","aria-hidden":"true"})," যোগ করুন"]})]}),e.jsxs("table",{className:"bis-ag-table",children:[e.jsxs("colgroup",{children:[e.jsx("col",{style:{width:52}}),e.jsx("col",{}),e.jsx("col",{style:{width:44}})]}),e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"ক্রম"}),e.jsx("th",{style:{textAlign:"left"},children:"আলোচ্যসূচি"}),e.jsx("th",{})]})}),e.jsxs("tbody",{children:[t.agendaItems.length===0&&e.jsx("tr",{children:e.jsx("td",{colSpan:3,className:"bis-ag-empty",children:"কোনো আলোচ্যসূচি নেই — উপরে + যোগ করুন চাপুন"})}),t.agendaItems.map((o,u)=>e.jsxs("tr",{children:[e.jsx("td",{className:"bis-ag-sl",children:E(u+1).padStart(2,"০")}),e.jsx("td",{className:"bis-ag-topic",children:e.jsx("input",{type:"text",className:"bis-ag-input",value:o.topic,onChange:r=>c(o.id,r.target.value),placeholder:"আলোচ্যসূচি লিখুন...","aria-label":`আলোচ্যসূচি — ${E(u+1)} নং`,lang:"bn"})}),e.jsx("td",{className:"bis-ag-del",children:e.jsx("button",{className:"bis-ag-del-btn",onClick:()=>g(o.id),title:"মুছুন","aria-label":`${E(u+1)} নং আলোচ্যসূচি মুছুন`,style:{WebkitAppearance:"none",backgroundColor:"#fef2f2",border:"1.5px solid #fca5a5",color:"#ef4444"},children:e.jsx("i",{className:"ti ti-x","aria-hidden":"true"})})})]},o.id))]})]})]}),e.jsx("style",{children:`
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
      `})]})}const Se=I.memo(Ne),ke="সম্মানিত উপস্থিত সকলকে স্বাগত জানিয়ে সভাপতি সভার কার্যক্রম শুরু করেন। তিনি সকলের উপস্থিতির জন্য ধন্যবাদ জ্ঞাপন করেন এবং আজকের সভার মূল আলোচ্যসূচি সম্পর্কে সংক্ষিপ্ত ধারণা প্রদান করেন।",Ae="আলোচ্যসূচির সকল বিষয়ে আলোচনা সম্পন্ন হওয়ার পর সভাপতি উপস্থিত সকল সদস্যকে তাঁদের গঠনমূলক মতামত ও সক্রিয় অংশগ্রহণের জন্য ধন্যবাদ জানান। পরবর্তী সভার তারিখ ও সময় যথাসময়ে জানানো হবে মর্মে উল্লেখ করে তিনি সভার সমাপ্তি ঘোষণা করেন।";function Te({label:t,variant:i="orange"}){const s={default:{bg:"#f1f5f9",border:"#94a3b8",color:"#475569"},blue:{bg:"#eff6ff",border:"#3b82f6",color:"#1d4ed8"},green:{bg:"#f0fdf4",border:"#22c55e",color:"#065f46"},purple:{bg:"#faf5ff",border:"#a855f7",color:"#6b21a8"},orange:{bg:"#fff7ed",border:"#f97316",color:"#9a3412"}}[i];return e.jsx("div",{className:"ocs-block-title",style:{background:s.bg,borderLeftColor:s.border,color:s.color},children:t})}function J({label:t,variant:i,value:n,onChange:s,placeholder:l,template:c}){const g=()=>{s(n?`${n}

${c}`:c)};return e.jsxs("div",{className:"ocs-card",children:[e.jsxs("div",{className:"ocs-card-head",children:[e.jsx(Te,{label:t,variant:i}),e.jsx("button",{type:"button",className:"ocs-template-btn",onClick:g,children:"টেমপ্লেট যোগ করুন"})]}),e.jsx("textarea",{value:n,onChange:b=>s(b.target.value),className:"ocs-textarea",rows:9,placeholder:l,lang:"bn"})]})}function Ie({minutes:t,setMinutes:i}){return e.jsxs("div",{className:"ocs-wrap",children:[e.jsxs("div",{className:"ocs-grid",children:[e.jsx(J,{label:"উদ্বোধনী",variant:"orange",value:t.generalNotes,onChange:n=>i({...t,generalNotes:n}),placeholder:"সভার উদ্বোধনী বক্তব্য, প্রারম্ভিক মন্তব্য বা পর্যবেক্ষণ লিখুন...",template:ke}),e.jsx(J,{label:"সমাপনী",variant:"blue",value:t.closingNotes,onChange:n=>i({...t,closingNotes:n}),placeholder:"সভার সমাপনী বক্তব্য বা সংক্ষিপ্ত উপসংহার লিখুন...",template:Ae})]}),e.jsx("style",{children:`
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
      `})]})}const De=I.memo(Ie),U={Pending:{label:"অপেক্ষমান",bg:"#fef9c3",color:"#a16207"},"In Progress":{label:"চলমান",bg:"#dbeafe",color:"#1d4ed8"},Completed:{label:"সম্পন্ন",bg:"#dcfce7",color:"#15803d"}};function ze(t,i){if(!i)return[];const n=T.find(x=>x.name===t),s=n?[n]:T;let l;for(const x of s)if(l=x.committees.find(a=>a.name===i),l)break;if(!l)return[];const c=new Set,g=[],b=x=>{x&&!c.has(x)&&(c.add(x),g.push(x))};b(l.chairperson),b(l.secretary);for(const x of l.members??[])b(x.name);return g}function Be({minutes:t,setMinutes:i}){const n=ze(t.organizationName,t.meetingTitle),s=(c,g,b)=>i({...t,agendaItems:t.agendaItems.map(x=>{if(x.id!==c)return x;const a=x.decisions[0]||{id:M(),description:"",madeBy:""};return{...x,decisions:[{...a,[g]:b}]}})}),l=(c,g,b)=>i({...t,agendaItems:t.agendaItems.map(x=>{if(x.id!==c)return x;const a=x.actionItems[0]||{id:M(),description:"",assignedTo:"",dueDate:"",priority:"Medium",status:"Pending"};return{...x,actionItems:[{...a,[g]:b}]}})});return t.agendaItems.length===0?e.jsxs("div",{className:"dd-empty",children:[e.jsx("p",{children:'কোনো আলোচ্যসূচি নেই। প্রথমে "আলোচ্যসূচি" ধাপে গিয়ে আইটেম যুক্ত করুন।'}),e.jsx("style",{children:".dd-empty { text-align: center; padding: 48px 16px; color: #94a3b8; font-size: 13px; }"})]}):e.jsxs("div",{className:"dd-wrap",children:[e.jsxs("table",{className:"dd-table",children:[e.jsxs("colgroup",{children:[e.jsx("col",{style:{width:"5%"}}),e.jsx("col",{style:{width:"25%"}}),e.jsx("col",{style:{width:"35%"}}),e.jsx("col",{style:{width:"13%"}}),e.jsx("col",{style:{width:"10%"}}),e.jsx("col",{style:{width:"12%"}})]}),e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"নং"}),e.jsx("th",{style:{textAlign:"left"},children:"আলোচ্যসূচি"}),e.jsx("th",{style:{textAlign:"left"},children:"আলোচনা ও সিদ্ধান্ত"}),e.jsx("th",{className:"dd-col-assignee",style:{textAlign:"left"},children:"দায়িত্ব"}),e.jsx("th",{className:"dd-col-due",children:"সময়সীমা"}),e.jsx("th",{children:"অবস্থা"})]})}),e.jsx("tbody",{children:t.agendaItems.map((c,g)=>{const b=c.decisions[0],x=c.actionItems[0];return e.jsxs("tr",{children:[e.jsx("td",{className:"dd-num","data-label":"ক্রম",children:g+1}),e.jsx("td",{className:"dd-readonly","data-label":"আলোচ্যসূচি",children:c.topic?e.jsx("div",{className:"dd-topic",children:c.topic}):e.jsx("span",{className:"dd-muted",children:"—"})}),e.jsx("td",{"data-label":"আলোচনা ও সিদ্ধান্ত",children:e.jsx("textarea",{value:b?.description??"",onChange:a=>s(c.id,"description",a.target.value),placeholder:"আলোচনা ও গৃহীত সিদ্ধান্ত লিখুন...",className:"dd-cell-input",rows:3,lang:"bn"})}),e.jsxs("td",{className:"dd-col-assignee","data-label":"দায়িত্ব",children:[e.jsx("input",{list:`dd-people-${c.id}`,value:x?.assignedTo??"",onChange:a=>l(c.id,"assignedTo",a.target.value),placeholder:"নাম / বিভাগ",className:"dd-cell-input",lang:"bn"}),e.jsx("datalist",{id:`dd-people-${c.id}`,children:n.map(a=>e.jsx("option",{value:a},a))})]}),e.jsx("td",{className:"dd-col-due","data-label":"সময়সীমা",children:e.jsx("input",{type:"date",value:x?.dueDate??"",onChange:a=>l(c.id,"dueDate",a.target.value),className:"dd-cell-input dd-date-input"})}),e.jsx("td",{"data-label":"অবস্থা",children:e.jsx("div",{className:"dd-status-group",children:he.map(a=>e.jsxs("label",{className:"dd-status-check",children:[e.jsx("input",{type:"checkbox",checked:x?.status===a,onChange:()=>{x?.status===a?i({...t,agendaItems:t.agendaItems.map(f=>f.id===c.id?{...f,actionItems:[]}:f)}):l(c.id,"status",a)}}),e.jsx("span",{style:{color:U[a].color},children:U[a].label})]},a))})})]},c.id)})})]}),e.jsx("style",{children:`
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
      `})]})}const Me=I.memo(Be);function C(t){if(!t)return 0;const[i,n]=t.split(":").map(Number);return(i||0)*60+(n||0)}function O(t){const i=Math.floor(t/60)%24,n=t%60,s=i>=12?"PM":"AM",l=i%12||12;return`${String(l).padStart(2,"0")}:${String(n).padStart(2,"0")} ${s}`}function $e(t,i,n,s){const l=C(i)||C("09:00"),c=C(n)||l+180;let g=l+3+Math.floor(Math.random()*5);for(let x=0;x<t;x++)g+=8+Math.floor(Math.random()*8);return g>c&&(g=c-2),`${s?s.split("-").reverse().join("/"):new Date().toISOString().split("T")[0].split("-").reverse().join("/")} ${O(g)}`}function Ce({minutes:t,setMinutes:i}){const[n,s]=I.useState(!1),l=I.useRef(null),c=800,g=533,b=Array.isArray(t.meetingImage)?t.meetingImage:t.meetingImage?[t.meetingImage]:[],x=(h,y)=>new Promise(S=>{const o=new FileReader;o.onload=u=>{const r=new Image;r.onload=()=>{const d=l.current;if(!d)return;const m=d.getContext("2d",{alpha:!1});if(!m)return;d.width=c,d.height=g;const j=Math.max(c/r.width,g/r.height),k=c/2-r.width/2*j,z=g/2-r.height/2*j;m.fillStyle="#FFFFFF",m.fillRect(0,0,c,g),m.drawImage(r,k,z,r.width*j,r.height*j);const v=$e(y,t.startTime,t.endTime,t.meetingDate);m.save(),m.font='bold 32px "Courier New", Courier, monospace',m.textAlign="right",m.shadowColor="rgba(0, 0, 0, 0.8)",m.shadowBlur=4,m.lineWidth=4,m.strokeStyle="rgba(0, 0, 0, 0.6)",m.strokeText(v,c-40,g-40),m.shadowBlur=0,m.fillStyle="#ff9800",m.fillText(v,c-40,g-40),m.restore(),S(d.toDataURL("image/jpeg",.6))},r.src=u.target?.result},o.readAsDataURL(h)}),a=async h=>{const y=h.target.files;if(!y||y.length===0)return;s(!0);const S=[],o=b.length;for(let u=0;u<y.length;u++){const r=await x(y[u],o+u);S.push(r)}i({...t,meetingImage:[...b,...S]}),s(!1),h.target.value=""},f=h=>{const y=b.filter((S,o)=>o!==h);i({...t,meetingImage:y[0]??""})};return e.jsxs("div",{className:"w-full",children:[e.jsx("canvas",{ref:l,className:"hidden"}),e.jsx("div",{className:"bg-white rounded-2xl border border-slate-200 overflow-hidden",children:e.jsx("div",{className:"p-4 sm:p-6",children:e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6",children:[e.jsxs("div",{className:"sm:col-span-1 flex flex-row sm:flex-col gap-3",children:[e.jsxs("div",{className:"flex-1 p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-200",children:[e.jsxs("label",{className:"text-[11px] font-black text-slate-400 uppercase flex items-center gap-2 mb-2",children:[e.jsx(ae,{"aria-hidden":"true"})," তারিখ ও সময়"]}),e.jsx("p",{className:"text-sm font-bold text-slate-700",children:t.meetingDate||"—"}),e.jsx("p",{className:"text-xs text-slate-500 font-medium",children:t.startTime?`${O(C(t.startTime))} — ${O(C(t.endTime||""))}`:"—"}),b.length>0&&e.jsxs("p",{className:"text-[10px] text-indigo-500 font-bold mt-1",children:[b.length," টি ফটো"]})]}),e.jsx("input",{id:"multi-upload",type:"file",accept:"image/*",multiple:!0,onChange:a,className:"hidden"}),e.jsxs("label",{htmlFor:"multi-upload",className:"flex-1 flex flex-col items-center justify-center min-h-[100px] sm:min-h-[140px] border-2 border-dashed border-slate-200 rounded-2xl hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer group",children:[e.jsx("div",{className:"p-3 bg-white shadow-md rounded-full mb-2 group-hover:scale-110 transition-transform",children:e.jsx(se,{className:"text-indigo-600"})}),e.jsx("span",{className:"text-xs font-bold text-slate-600",children:"ফটো যোগ করুন"}),e.jsx("span",{className:"text-[10px] text-slate-400 mt-1 uppercase font-bold",children:"একাধিক নির্বাচন"})]})]}),e.jsx("div",{className:"sm:col-span-3",children:b.length>0?e.jsxs("div",{className:"grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1",children:[b.map((h,y)=>e.jsxs("div",{className:"relative group rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50",children:[e.jsx("img",{src:h,alt:`Photo ${y+1}`,className:"w-full aspect-[3/2] object-cover"}),e.jsx("div",{className:"absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center",children:e.jsx("button",{onClick:()=>f(y),className:"p-3 bg-white text-rose-600 rounded-full shadow-xl hover:bg-rose-600 hover:text-white transition-all","aria-label":`${y+1} নং ফটো মুছুন`,children:e.jsx(re,{size:16})})}),e.jsxs("div",{className:"absolute top-2 left-2 px-2 py-0.5 bg-black/60 rounded text-[10px] text-white font-black",children:["#",y+1]})]},y)),n&&e.jsxs("div",{className:"w-full aspect-[3/2] bg-indigo-50 rounded-xl border-2 border-dashed border-indigo-200 flex flex-col items-center justify-center animate-pulse",children:[e.jsx("div",{className:"w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"}),e.jsx("p",{className:"text-[10px] font-black text-indigo-400 uppercase",children:"প্রক্রিয়াকরণ..."})]})]}):e.jsxs("div",{className:"w-full min-h-[220px] sm:min-h-[350px] bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300",children:[e.jsx(oe,{size:36,className:"opacity-20 mb-3"}),e.jsx("p",{className:"text-sm font-bold text-slate-400",children:"কোনো ফটো নেই"}),e.jsx("p",{className:"text-xs text-slate-300 mt-1",children:"বাম দিক থেকে ফটো যোগ করুন"})]})})]})})})]})}const B=t=>{if(t==null)return"";const i={0:"০",1:"১",2:"২",3:"৩",4:"৪",5:"৫",6:"৬",7:"৭",8:"৮",9:"৯"};return t.toString().replace(/\d/g,n=>i[n])},He=["রবিবার","সোমবার","মঙ্গলবার","বুধবার","বৃহস্পতিবার","শুক্রবার","শনিবার"],Pe=["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"],Re=t=>{if(!t)return"";const i=new Date(t),n=He[i.getDay()],s=B(String(i.getDate()).padStart(2,"0")),l=Pe[i.getMonth()],c=B(i.getFullYear());return`${n}, ${s} ${l} ${c}`},V=t=>({Present:"উপস্থিত",Absent:"অনুপস্থিত"})[t]??t;function Fe({minutes:t,setMinutes:i}){const n=ee(t.attendees),s=t.attendees.length,l=s<=15?12:s<=22?11:s<=30?10:9,c=s<=15?9:s<=22?7:s<=30?5:4;return e.jsxs("div",{className:"pl-page",style:{"--pl-row-font":`${l}px`,"--pl-row-pad":`${c}px 8px`},children:[e.jsxs("div",{className:"pl-header",children:[e.jsx("h1",{className:"pl-org",children:t.organizationName}),t.organizationAddress&&e.jsx("p",{className:"pl-org-addr",children:t.organizationAddress}),e.jsx("h2",{className:"pl-title",children:(t.meetingTitle||"--")+" এর উপস্থিতি তালিকা"}),e.jsxs("p",{className:"pl-date",children:["তারিখ: ",Re(t.meetingDate)]})]}),e.jsxs("p",{className:"pl-summary",children:["মোট: ",B(n.total)," |  উপস্থিত: ",B(n.present)," |  অনুপস্থিত: ",B(n.absent)," |  উপস্থিতির হার: ",B(n.presentPercentage),"%"]}),e.jsxs("table",{className:"pl-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{style:{width:"6%"},children:"ক্রম"}),e.jsx("th",{style:{width:"20%",textAlign:"left"},children:"নাম"}),e.jsx("th",{style:{width:"16%",textAlign:"left"},children:"পদবি"}),e.jsx("th",{style:{width:"18%",textAlign:"left"},children:"বিভাগ / সেকশন"}),e.jsx("th",{style:{width:"12%"},children:"কমিটিতে ভূমিকা"}),e.jsx("th",{style:{width:"12%"},children:"উপস্থিতি"}),e.jsx("th",{style:{width:"16%"},children:"স্বাক্ষর"})]})}),e.jsx("tbody",{children:t.attendees.map((g,b)=>e.jsxs("tr",{children:[e.jsx("td",{style:{textAlign:"center"},children:B(b+1)}),e.jsx("td",{children:g.name}),e.jsx("td",{children:g.designation}),e.jsx("td",{children:g.department}),e.jsx("td",{style:{textAlign:"center"},children:g.committeeRole||"—"}),e.jsx("td",{style:{textAlign:"center",fontWeight:600},children:i?e.jsxs("label",{style:{display:"inline-flex",alignItems:"center",gap:6,cursor:"pointer"},children:[e.jsx("input",{type:"checkbox",checked:g.attendanceStatus==="Present",onChange:x=>{const a=t.attendees.map((f,h)=>h===b?{...f,attendanceStatus:x.target.checked?"Present":"Absent"}:f);i({...t,attendees:a})},style:{width:16,height:16,accentColor:"#16a34a",cursor:"pointer"},"aria-label":`${g.name||"অতিথি"} উপস্থিতি`}),e.jsx("span",{style:{fontSize:12,color:g.attendanceStatus==="Present"?"#16a34a":"#dc2626"},children:V(g.attendanceStatus)})]}):V(g.attendanceStatus)}),e.jsx("td",{})]},g.id??b))})]}),e.jsx("style",{children:`
        ${Q}
        ${X}

        .pl-page { max-width: 900px; margin: 0 auto; font-family: 'Noto Sans Bengali', Arial, sans-serif; }
        .pl-header { text-align: center; margin-bottom: 18px; }
        .pl-org { font-size: 18px; font-weight: 700; margin: 0; }
        .pl-org-addr { font-size: 12px; color: #475569; margin: 2px 0 10px; }
        .pl-title { font-size: 15px; font-weight: 700; margin: 10px 0 4px; border-bottom: 2px solid #000; display: inline-block; padding-bottom: 4px; }
        .pl-date { font-size: 12.5px; margin: 4px 0 0; }
        .pl-summary { font-size: 12px; font-weight: 600; margin-bottom: 12px; }
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
      `})]})}const w=t=>{if(t==null)return"";const i={0:"০",1:"১",2:"২",3:"৩",4:"৪",5:"৫",6:"৬",7:"৭",8:"৮",9:"৯"};return t.toString().replace(/\d/g,n=>i[n])},te=["রবিবার","সোমবার","মঙ্গলবার","বুধবার","বৃহস্পতিবার","শুক্রবার","শনিবার"],L=["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"],Ee=t=>{try{const i=new Date(t),n=w(i.getDate()),s=L[i.getMonth()],l=w(i.getFullYear());return`${n} ${s}, ${l}`}catch{return"[তারিখ]"}},R=t=>{if(!t)return"";const i=new Date(t),n=w(String(i.getDate()).padStart(2,"0")),s=L[i.getMonth()],l=w(i.getFullYear());return`${n} ${s} ${l}`},Oe=t=>{if(!t)return"";const i=new Date(t),n=te[i.getDay()],s=w(String(i.getDate()).padStart(2,"0")),l=L[i.getMonth()],c=w(i.getFullYear());return`${n}, ${s} ${l} ${c}`},Y=t=>{if(!t)return"";const[i,n]=t.split(":"),l=parseInt(i)%12||12;return`${w(String(l).padStart(2,"0"))}:${w(n)}`},$=t=>{if(!t)return"";const i=parseInt(t.split(":")[0]);return i>=5&&i<12?"সকাল":i>=12&&i<15?"দুপুর":i>=15&&i<18?"বিকাল":i>=18&&i<20?"সন্ধ্যা":"রাত"},We=t=>{if(!t)return"[সময়]";const i=t.split(":");if(i.length<2)return"[সময়]";const n=parseInt(i[0])||0,s=parseInt(i[1])||0,l=n%12||12,c=String(s).padStart(2,"0");return w(`${l}:${c}`)},Le=t=>t?t.replace(/(\d+)/g,i=>w(i)).replace("hours","ঘণ্টা").replace("hour","ঘণ্টা").replace("minutes","মিনিট").replace("minute","মিনিট"):"",_e=t=>({Present:"উপস্থিত",Absent:"অনুপস্থিত",Excused:"অনুমতিপ্রাপ্ত",Late:"বিলম্বিত"})[t]??t,q=t=>!!t&&/[\u0980-\u09FFa-zA-Z0-9]/.test(t),Ge=t=>{if(!t)return"";const i=new Date(t);return i.setDate(i.getDate()-8),i.toISOString().split("T")[0]},Z=t=>{if(!t)return"";const i=t.split(`
`);for(;i.length>0;){const n=i[i.length-1],s=n.trim()!==""&&!/[\u0980-\u09FFa-zA-Z0-9]/.test(n),l=n.trim()==="";if(s||l&&i.length>1)i.pop();else break}return i.join(`
`).trimEnd()};function Je(t){if(!t)return{male:0,female:0,total:0};const i=[];t.chairpersonGender&&i.push(t.chairpersonGender),t.secretaryGender&&i.push(t.secretaryGender);for(const l of t.members??[])l.gender&&i.push(l.gender);const n=i.filter(l=>l==="পুরুষ").length,s=i.filter(l=>l==="মহিলা").length;return{male:n,female:s,total:i.length}}const Ue=t=>t?Array.isArray(t)?t.filter(Boolean):typeof t=="string"&&t.length>0?[t]:[]:[];function Ve({status:t}){const i=[{key:"Pending",label:"অপেক্ষমান"},{key:"In Progress",label:"চলমান"},{key:"Completed",label:"সম্পন্ন"}];return e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"6px"},children:i.map(n=>{const s=t===n.key;return e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"6px"},children:[e.jsx("div",{style:{width:"13px",height:"13px",border:"1.5px solid #333",borderRadius:"2px",backgroundColor:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}),e.jsx("span",{style:{fontSize:"11px",fontWeight:s?"bold":"normal",color:s?"#000":"#555",lineHeight:"1.3"},children:n.label})]},n.key)})})}function Ye({minutes:t}){const i=t.meetingDate?te[new Date(t.meetingDate).getDay()]:"[দিন]",n=t.meetingDate?Ee(t.meetingDate):"[তারিখ]",s=t.startTime?We(t.startTime):"[সময়]",l={fontSize:"20px",lineHeight:"1.8",textAlign:"justify",margin:"0",fontWeight:"normal",color:"#000",paddingLeft:"0"};return e.jsxs("div",{style:{width:"100%",display:"flex",flexDirection:"column",gap:"24px"},children:[e.jsxs("p",{style:l,children:["এতদ্বারা ",t.organizationName||"[কারখানার নাম]"," এর ",t.meetingTitle||"[কমিটির নাম]"," -র সকল সদস্যগণের অবগতির জন্য জানানো যাচ্ছে যে, আগামী ",n," ইং তারিখ রোজ ",i," ",$(t.startTime)&&e.jsxs("span",{children:[$(t.startTime)," "]})," ",s," ঘটিকার সময় কারখানার অভ্যন্তরে ",t.venue||"[স্থান]"," এ একটি জরুরী আলোচনা সভা অনুষ্ঠিত হবে।"]}),e.jsxs("p",{style:l,children:["উক্ত সভায় ",t.meetingTitle||"[কমিটির নাম]"," -র সকল সদস্যগণকে যথা সময়ে নির্দিষ্ট স্থানে উপস্থিত থাকার জন্য বিশেষভাবে অনুরোধ করা হলো।"]})]})}function qe({src:t,index:i}){return e.jsx("div",{style:{position:"relative",display:"block"},children:e.jsx("img",{src:t,alt:`মিটিং ছবি ${i+1}`,style:{width:"100%",height:"auto",maxHeight:"320px",border:"2px solid black",objectFit:"contain",display:"block"}})})}function K({minutes:t,printOption:i,viewSections:n,authorization:s}){const l=W(),c=ee(t.attendees),g=me(t.startTime,t.endTime),b=Ue(t.meetingImage),a=T.find(r=>r.name===t.organizationName)?.committees.find(r=>r.name===t.meetingTitle),f=Je(a),h=r=>{if(n)switch(r){case"basic":return n.basic;case"attendance":return n.attendance;case"agenda":return n.agenda;case"notice":return n.notice;case"approval":return n.approval;default:return!1}return i==="all"||i==="basic"&&(r==="basic"||r==="agenda")||i==="attendance"&&r==="attendance"||i==="agenda"&&r==="agenda"||i==="notice"&&r==="notice"},y=n?n.approval:i!=="notice"&&i!=="attendance",S=!!s&&(s.visibility.hrManager||s.visibility.factoryHead||s.visibility.hoHrHead||s.visibility.headOfOperations||!!(s.visibility?.president&&s.president)||!!(s.visibility?.secretary&&s.secretary)),o=[{label:"মিটিং ধরন",value:t.meetingType},{label:"তারিখ",value:Oe(t.meetingDate)},{label:"সময়",value:e.jsxs(e.Fragment,{children:[$(t.startTime)&&e.jsxs("span",{style:{fontWeight:"600"},children:[$(t.startTime)," "]}),Y(t.startTime)," –"," ",$(t.endTime)&&e.jsxs("span",{style:{fontWeight:"600"},children:[$(t.endTime)," "]}),Y(t.endTime),g&&` (মোট: ${Le(g)})`]})},{label:"স্থান",value:t.venue},{label:"সভাপতি",value:t.chairperson},{label:"সচিব",value:t.secretary},...t.meetingEstablishDate?[{label:"কমিটি প্রতিষ্ঠার তারিখ",value:R(t.meetingEstablishDate)}]:[],...f.total>0?[{label:"মোট সদস্য",value:`নারী ${w(f.female)} জন (${w(Math.round(f.female/f.total*100))}%), পুরুষ ${w(f.male)} জন (${w(Math.round(f.male/f.total*100))}%), মোট ${w(f.total)} জন`}]:[],...t.meetingNumber?[{label:"রেফারেন্স নম্বর",value:t.meetingNumber}]:[]],u=(r=!1)=>{const d=s,m=l.authorities,j=[{show:!!(d&&d.visibility?.president&&d.president),name:d?.president??"",desig:d?.presidentDesignation??"সভাপতি",sub:t.meetingTitle,date:"",label:"--"},{show:!!(d&&d.visibility?.secretary&&d.secretary),name:d?.secretary??"",desig:d?.secretaryDesignation??"সচিব",sub:t.meetingTitle,date:"",label:"--"},{show:!!d?.visibility.hrManager,name:m.hrManager.name,desig:m.hrManager.designation,sub:"",date:"",label:"--"},{show:!!d?.visibility.factoryHead,name:m.factoryHead.name,desig:m.factoryHead.designation,sub:"",date:"",label:"কর্তৃপক্ষ ১"},{show:!!d?.visibility.hoHrHead,name:m.hoHrHead.name,desig:m.hoHrHead.designation,sub:"",date:"",label:"--"},{show:!!d?.visibility.headOfOperations,name:m.headOfOperations.name,desig:m.headOfOperations.designation,sub:"",date:"",label:"কর্তৃপক্ষ ২"}].filter(v=>v.show&&v.name),k=j.length,z=v=>k===1?"left":k===2?v===0?"left":"right":v===0?"left":v===k-1?"right":"center";return e.jsx("div",{style:{display:"flex",flexWrap:"wrap",justifyContent:k===1?"flex-start":"space-between",gap:"30px 15px",marginTop:"60px",width:"100%",pageBreakInside:"avoid"},children:j.map((v,H)=>e.jsxs("div",{style:{textAlign:z(H),flex:k===1?"0 1 250px":`0 1 calc(${100/k}% - 20px)`,minWidth:"180px",maxWidth:k===1?"250px":"300px"},children:[!r&&e.jsx("p",{style:{fontWeight:"bold",marginBottom:"8px",fontSize:"12px",color:"#333"},children:v.label}),e.jsx("div",{style:{height:r?"64px":"52px"}}),e.jsxs("div",{style:{borderTop:"2px solid black",paddingTop:"8px",width:"100%"},children:[e.jsx("p",{style:{fontWeight:"bold",fontSize:r?"20px":"18px",marginBottom:"2px",color:"#000"},children:v.name}),e.jsx("p",{style:{fontSize:r?"18px":"16px",color:"#444",marginBottom:v.sub?"1px":"3px"},children:v.desig}),v.sub&&e.jsx("p",{style:{fontSize:r?"16px":"14px",color:"#444",marginBottom:"3px"},children:v.sub}),!r&&e.jsxs("p",{style:{fontSize:"16px",color:"#666",whiteSpace:"nowrap"},children:["তারিখ: ",v.date?R(v.date):"___________"]})]})]},H))})};return e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"print-page",style:{padding:"0px",maxWidth:"210mm",margin:"0 auto",backgroundColor:"white",fontFamily:"'Noto Sans Bengali', Arial, sans-serif"},children:[e.jsxs("header",{className:"print-header",style:{textAlign:"center",borderBottom:"2px solid black",paddingBottom:"12px",marginBottom:"16px",pageBreakAfter:"avoid"},children:[e.jsx("h1",{style:{fontSize:"20px",fontWeight:"bold",color:"black",marginBottom:"4px",textTransform:"uppercase",letterSpacing:"0.5px",lineHeight:"1.2"},children:t.organizationName||"ORGANIZATION NAME"}),e.jsx("p",{style:{fontSize:"12px",color:"black",marginBottom:"0",lineHeight:"1.4"},children:t.organizationAddress||"Address"})]}),e.jsxs("main",{className:"print-body",style:{minHeight:"50vh"},children:[h("notice")&&e.jsxs("div",{className:"print-single-page",style:{marginBottom:"32px"},children:[e.jsx("div",{style:{textAlign:"center",marginBottom:"50px",pageBreakAfter:"avoid"},children:e.jsx("h3",{style:{fontSize:"30px",fontWeight:"bold",textDecoration:"underline",marginBottom:"4px",lineHeight:"1.3"},children:"অফিস নোটিশ"})}),e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:"30px",fontSize:"14px",fontWeight:"600",pageBreakAfter:"avoid"},children:[e.jsxs("div",{style:{lineHeight:"1.4"},children:["সূত্র: ",t.meetingNumber||"N/A"]}),e.jsxs("div",{style:{lineHeight:"1.4"},children:["তারিখ: ",R(Ge(t.meetingDate))]})]}),e.jsx("div",{style:{marginBottom:"24px"},children:e.jsx(Ye,{minutes:t})}),t.agendaItems.length>0&&(()=>{const r=t.agendaItems.length,d=r<=5?20:r<=8?17:r<=12?15:13,m=r<=5?1.8:r<=8?1.6:1.4;return e.jsxs("div",{style:{marginBottom:"32px",pageBreakInside:"avoid",marginTop:"10px"},children:[e.jsx("p",{style:{marginBottom:"15px",fontSize:"20px",lineHeight:"1.4",fontWeight:"normal",textDecoration:"underline",textUnderlineOffset:"5px"},children:"আলোচ্যসূচি:"}),e.jsx("ul",{style:{listStyleType:"disc",listStylePosition:"outside",fontSize:`${d}px`,lineHeight:m,margin:"0",padding:"0 0 0 25px"},children:t.agendaItems.map((j,k)=>e.jsx("li",{style:{marginBottom:"8px",fontStyle:"italic",fontWeight:"normal",textAlign:"justify"},children:j.topic||`বিষয় ${k+1}`},k))})]})})(),e.jsx("div",{style:{marginBottom:"20px"},children:e.jsx("p",{style:{fontSize:"20px",lineHeight:"1.4",margin:"0"},children:"ধন্যবাদান্তে,"})}),S&&e.jsx("div",{style:{marginTop:"64px",pageBreakInside:"avoid"},children:u(!0)})]}),!h("notice")&&(h("basic")||h("agenda")||h("attendance"))&&e.jsx("div",{style:{textAlign:"center",marginBottom:"20px",pageBreakAfter:"avoid"},children:e.jsx("h2",{style:{fontSize:"18px",fontWeight:"bold",marginBottom:"0",borderBottom:"2px solid black",display:"inline-block",paddingBottom:"4px",paddingLeft:"16px",paddingRight:"16px",lineHeight:"1.3"},children:(t.meetingTitle||"--")+" এর সভার কার্যবিবরণী"})}),h("basic")&&e.jsxs("div",{style:{marginBottom:"32px",pageBreakInside:"avoid"},children:[e.jsx("h3",{style:{fontWeight:"bold",borderBottom:"2px solid black",paddingBottom:"6px",marginBottom:"16px",fontSize:"15px",lineHeight:"1.3"},children:"সাধারণ তথ্য"}),e.jsx("table",{style:{width:"100%",fontSize:"13px",border:"2px solid black",borderCollapse:"collapse"},children:e.jsx("tbody",{children:o.map(({label:r,value:d},m)=>e.jsxs("tr",{style:m<o.length-1?{borderBottom:"1px solid black"}:{},children:[e.jsxs("td",{style:{fontWeight:"bold",padding:"10px",width:"35%",borderRight:"1px solid black",backgroundColor:"#f9fafb",lineHeight:"1.4"},children:[r,":"]}),e.jsx("td",{style:{padding:"10px",lineHeight:"1.4",fontWeight:r==="সভাপতি"||r==="সচিব"?"600":void 0},children:d})]},m))})}),b.length>0&&e.jsxs("div",{style:{marginTop:"20px",pageBreakInside:"avoid"},children:[e.jsx("h3",{style:{fontWeight:"bold",borderBottom:"2px solid black",paddingBottom:"6px",marginBottom:"16px",fontSize:"15px",lineHeight:"1.3"},children:"মিটিং ছবি"}),e.jsx("div",{style:{display:"grid",gridTemplateColumns:b.length===1?"1fr":"repeat(2, 1fr)",gap:"12px"},children:b.map((r,d)=>e.jsx(qe,{src:r,index:d},d))})]}),q(t.generalNotes)&&e.jsxs("div",{style:{marginTop:"20px",pageBreakInside:"avoid"},children:[e.jsx("h3",{style:{fontWeight:"bold",borderBottom:"2px solid black",paddingBottom:"6px",marginBottom:"16px",fontSize:"15px",lineHeight:"1.3"},children:"সভার উদ্বোধনী"}),e.jsx("div",{style:{padding:"12px",border:"1px solid #ccc",borderRadius:"4px",backgroundColor:"#f9fafb",fontSize:"13px",lineHeight:"1.7",textAlign:"justify"},children:Z(t.generalNotes)})]})]}),h("attendance")&&e.jsxs("div",{className:"print-single-page",style:{marginBottom:"32px",pageBreakInside:"avoid"},children:[e.jsx("h3",{style:{fontWeight:"bold",borderBottom:"2px solid black",paddingBottom:"6px",marginBottom:"16px",fontSize:"15px",lineHeight:"1.3"},children:"উপস্থিতি তালিকা"}),e.jsxs("p",{style:{fontSize:"12px",marginBottom:"12px",fontWeight:"600",lineHeight:"1.6"},children:["মোট: ",w(c.total)," |  উপস্থিত: ",w(c.present)," |  অনুপস্থিত: ",w(c.absent)," |  উপস্থিতির হার: ",w(c.presentPercentage),"%"]}),e.jsxs("table",{style:{width:"100%",border:"2px solid black",fontSize:"12px",borderCollapse:"collapse"},children:[e.jsx("thead",{children:e.jsx("tr",{style:{backgroundColor:"#e5e7eb"},children:["ক্রম","নাম","পদবি","বিভাগ / সেকশন","কমিটিতে ভূমিকা","উপস্থিতি","স্বাক্ষর"].map((r,d)=>e.jsx("th",{style:{border:"1px solid black",padding:"10px",textAlign:d===0||d>=4?"center":"left",fontWeight:"bold",lineHeight:"1.4",width:d===0?"50px":d===4?"90px":d===5?"100px":d===6?"140px":void 0},children:r},d))})}),e.jsx("tbody",{children:t.attendees.map((r,d)=>e.jsxs("tr",{children:[e.jsx("td",{style:{border:"1px solid black",padding:"10px",textAlign:"center",fontWeight:"600",lineHeight:"1.4"},children:w(d+1)}),e.jsx("td",{style:{border:"1px solid black",padding:"10px",lineHeight:"1.4"},children:r.name}),e.jsx("td",{style:{border:"1px solid black",padding:"10px",lineHeight:"1.4"},children:r.designation}),e.jsx("td",{style:{border:"1px solid black",padding:"10px",lineHeight:"1.4"},children:r.department}),e.jsx("td",{style:{border:"1px solid black",padding:"10px",textAlign:"center",lineHeight:"1.4"},children:r.committeeRole||"—"}),e.jsx("td",{style:{border:"1px solid black",padding:"10px",textAlign:"center",fontWeight:"600",lineHeight:"1.4"},children:_e(r.attendanceStatus)}),e.jsx("td",{style:{border:"1px solid black",padding:"10px"}})]},d))})]})]}),h("agenda")&&t.agendaItems.length>0&&e.jsxs("div",{style:{marginBottom:"32px"},children:[e.jsx("h3",{style:{fontWeight:"bold",borderBottom:"2px solid black",paddingBottom:"6px",marginBottom:"16px",fontSize:"15px",lineHeight:"1.3"},children:"আলোচ্যসূচি ও সিদ্ধান্ত"}),e.jsxs("table",{style:{width:"100%",border:"2px solid black",borderCollapse:"collapse",fontSize:"12px",tableLayout:"fixed"},children:[e.jsxs("colgroup",{children:[e.jsx("col",{style:{width:"5%"}}),"   ",e.jsx("col",{style:{width:"25%"}}),"  ",e.jsx("col",{style:{width:"31%"}}),"  ",e.jsx("col",{style:{width:"15%"}}),"  ",e.jsx("col",{style:{width:"11%"}}),"  ",e.jsx("col",{style:{width:"13%"}}),"  "]}),e.jsx("thead",{children:e.jsx("tr",{style:{backgroundColor:"#e5e7eb"},children:[{title:"নং",align:"center"},{title:"আলোচ্যসূচি",align:"left"},{title:"আলোচনা ও সিদ্ধান্ত",align:"left"},{title:"দায়িত্ব",align:"left"},{title:"সময়সীমা",align:"center"},{title:"অবস্থা",align:"center"}].map((r,d)=>e.jsx("th",{style:{border:"1px solid black",padding:r.align==="center"?"9px 8px":"9px 10px",textAlign:r.align,fontWeight:"bold",lineHeight:1.5,verticalAlign:"middle"},children:r.title},d))})}),e.jsx("tbody",{children:t.agendaItems.map((r,d)=>{const m=r.decisions[0],j=r.actionItems[0];return e.jsxs("tr",{style:{backgroundColor:d%2===0?"#ffffff":"#fafafa",pageBreakInside:"avoid"},children:[e.jsx("td",{style:{border:"1px solid black",padding:"10px 8px",textAlign:"center",fontWeight:"bold",fontSize:"13px",verticalAlign:"top",lineHeight:"1.4"},children:w(String(d+1).padStart(2,"0"))}),e.jsx("td",{style:{border:"1px solid black",padding:"10px",verticalAlign:"top",lineHeight:"1.7"},children:r.topic?e.jsx("div",{style:{fontWeight:"bold",fontSize:"12px"},children:r.topic}):e.jsx("span",{style:{color:"#aaa"},children:"—"})}),e.jsx("td",{style:{border:"1px solid black",padding:"10px",verticalAlign:"top",lineHeight:"1.7"},children:m?.description?e.jsx("div",{style:{fontSize:"11px",textAlign:"justify"},children:m.description}):e.jsx("span",{style:{color:"#aaa"},children:"—"})}),e.jsx("td",{style:{border:"1px solid black",padding:"10px",verticalAlign:"top",fontSize:"11px",lineHeight:"1.6"},children:j?.assignedTo||e.jsx("span",{style:{color:"#aaa"},children:"—"})}),e.jsx("td",{style:{border:"1px solid black",padding:"10px",verticalAlign:"top",fontSize:"11px",lineHeight:"1.6",textAlign:"center"},children:j?.dueDate?R(j.dueDate):e.jsx("span",{style:{color:"#aaa"},children:"—"})}),e.jsx("td",{style:{border:"1px solid black",padding:"10px",verticalAlign:"top"},children:e.jsx(Ve,{status:j?.status??""})})]},d)})})]})]}),h("agenda")&&q(t.closingNotes)&&e.jsxs("div",{style:{marginTop:"24px",pageBreakInside:"avoid"},children:[e.jsx("h3",{style:{fontWeight:"bold",borderBottom:"2px solid black",paddingBottom:"6px",marginBottom:"16px",fontSize:"15px",lineHeight:"1.3"},children:"সভার সমাপনী"}),e.jsx("div",{style:{padding:"12px",border:"1px solid #ccc",borderRadius:"4px",backgroundColor:"#f9fafb",fontSize:"13px",lineHeight:"1.7",textAlign:"justify"},children:Z(t.closingNotes)})]})]}),y&&S&&e.jsx("footer",{className:"print-footer",style:{marginTop:"8px",paddingTop:"4px",pageBreakInside:"avoid"},children:u(!1)})]}),e.jsx("style",{children:`
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
      `})]})}const Ze=[{id:"basic",label:"প্রাথমিক তথ্য",icon:"ti-building"},{id:"opening",label:"উদ্বোধনী ও সমাপনী",icon:"ti-microphone"},{id:"discussion",label:"আলোচনা ও সিদ্ধান্ত",icon:"ti-table"},{id:"photo",label:"মিটিং ফটো",icon:"ti-photo"}];function nt(){const{user:t}=le(),i=W(),n=pe("meetings",i.id,t?.name??"unknown"),[s,l]=I.useState(G),[c,g]=I.useState(null),[b,x]=I.useState(!1),[a,f]=I.useState(F),[h,y]=I.useState("basic"),S=I.useRef(null),o=h!=="basic"&&h!=="opening"&&h!=="discussion"&&h!=="photo",u=h==="basic"||h==="opening"||h==="discussion"||h==="photo"?h:"basic",r=p=>{const D=(T.find(A=>A.name===p.organizationName)?.committees??T.flatMap(A=>A.committees)).find(A=>A.name===p.meetingTitle);D&&l(A=>({...A,president:D.chairperson,presidentDesignation:D.chairpersonDesignation??"সভাপতি",secretary:D.secretary,secretaryDesignation:D.secretaryDesignation??"সচিব",visibility:{...A.visibility,president:!0,secretary:!0}}))},d=p=>{x(!0),f(p),r(p)},m=()=>{x(!1),f(F),l(G),y("basic"),n.setEditingId(null)},j=()=>window.print(),k=async()=>{const p=S.current;if(!p)return;const N=await de(p,{scale:2,useCORS:!0}),D=N.toDataURL("image/png"),A=new ce("p","mm","a4"),P=A.internal.pageSize.getWidth(),ne=N.height*P/N.width;A.addImage(D,"PNG",0,0,P,ne),A.save(`Meeting_Minutes_${a.meetingTitle||"document"}.pdf`)},z=p=>{const N=p.split(`
`);for(;N.length>0;){const D=N[N.length-1],A=D.trim()!==""&&!/[\u0980-\u09FFa-zA-Z0-9]/.test(D),P=D.trim()==="";if(A||P&&N.length>1)N.pop();else break}return N.join(`
`).trimEnd()},v=()=>({organizationName:a.organizationName,organizationAddress:a.organizationAddress,department:a.department,meetingTitle:a.meetingTitle,meetingEstablishDate:a.meetingEstablishDate,meetingType:a.meetingType,meetingNumber:a.meetingNumber,noticeDate:a.noticeDate,meetingDate:a.meetingDate,startTime:a.startTime,endTime:a.endTime,venue:a.venue,virtualMeetingLink:a.virtualMeetingLink,meetingImage:Array.isArray(a.meetingImage)?"":a.meetingImage??"",photosJson:JSON.stringify(Array.isArray(a.meetingImage)?a.meetingImage:a.meetingImage?[a.meetingImage]:[]),chairperson:a.chairperson,secretary:a.secretary,attendeesJson:JSON.stringify(a.attendees??[]),previousMinutesReference:a.previousMinutesReference,previousMinutesApproval:a.previousMinutesApproval,previousMinutesRejectionDetails:a.previousMinutesRejectionDetails,agendaJson:JSON.stringify(a.agendaItems??[]),generalNotes:z(a.generalNotes),closingNotes:z(a.closingNotes),annexuresJson:JSON.stringify(a.annexures??[]),nextMeetingDate:a.nextMeetingDate,nextMeetingTime:a.nextMeetingTime,nextMeetingVenue:a.nextMeetingVenue,authorizationJson:JSON.stringify(s),distributionJson:JSON.stringify(a.distributionList??[])}),H=p=>({...F,organizationName:String(p.organizationName??""),organizationAddress:String(p.organizationAddress??""),department:String(p.department??""),meetingTitle:String(p.meetingTitle??""),meetingEstablishDate:String(p.meetingEstablishDate??""),meetingType:String(p.meetingType??"মাসিক"),meetingNumber:String(p.meetingNumber??""),noticeDate:String(p.noticeDate??""),meetingDate:String(p.meetingDate??""),startTime:String(p.startTime??""),endTime:String(p.endTime??""),venue:String(p.venue??""),virtualMeetingLink:String(p.virtualMeetingLink??""),meetingImage:(()=>{try{const N=JSON.parse(String(p.photosJson??"[]"));return N.length>0?N:p.meetingImage?[String(p.meetingImage)]:[]}catch{return p.meetingImage?[String(p.meetingImage)]:[]}})(),chairperson:String(p.chairperson??""),secretary:String(p.secretary??""),attendees:(()=>{try{return JSON.parse(String(p.attendeesJson??"[]"))}catch{return[]}})(),previousMinutesReference:String(p.previousMinutesReference??""),previousMinutesApproval:String(p.previousMinutesApproval??"N/A"),previousMinutesRejectionDetails:String(p.previousMinutesRejectionDetails??""),agendaItems:(()=>{try{return JSON.parse(String(p.agendaJson??"[]"))}catch{return[]}})(),generalNotes:String(p.generalNotes??""),closingNotes:String(p.closingNotes??""),annexures:(()=>{try{return JSON.parse(String(p.annexuresJson??"[]"))}catch{return[]}})(),nextMeetingDate:String(p.nextMeetingDate??""),nextMeetingTime:String(p.nextMeetingTime??""),nextMeetingVenue:String(p.nextMeetingVenue??""),distributionList:(()=>{try{return JSON.parse(String(p.distributionJson??"[]"))}catch{return[]}})()}),_=p=>{n.setEditingId(String(p.id??"")),f(H(p));try{const N=JSON.parse(String(p.authorizationJson??""));N&&l(N)}catch{}y("basic")},ie=[{label:"নোটিশ",onClick:()=>y("notice")},{label:"সভার কার্যবিবরণী",onClick:()=>y("minutes")},{label:"উপস্থিতি তালিকা",onClick:()=>y("participants")}];return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`${Q}${X}`}),e.jsxs(ge,{moduleName:"সভার কার্যবিবরণী",moduleNameEn:"Meeting Minutes",date:a.meetingDate,onDateChange:p=>d({...a,meetingDate:p}),steps:Ze,activeStep:u,onStepChange:p=>y(p),billItems:ie,isBillActive:o,onSave:async()=>{const p=v(),N=n.editingId?await n.update(n.editingId,p):await n.save(p);return N?(m(),g(null)):g("সংরক্ষণ ব্যর্থ হয়েছে। ইন্টারনেট সংযোগ ও কনফিগারেশন পরীক্ষা করুন।"),N},isSaving:n.isSaving,configured:n.configured,adapterName:n.adapterName,saveDisabled:!a.meetingTitle,editingId:n.editingId,onCancelEdit:m,isDirty:b,onReset:m,onUpdate:_,updateModule:"meetings",updateLabel:"মিটিং রেকর্ড খুঁজুন",updateSearchPlaceholder:"মিটিং শিরোনাম দিয়ে খুঁজুন...",records:n.records,isLoading:n.isLoading,onLoadRecord:p=>_(p),onDeleteRecord:n.remove,onReload:n.reload,auth:s,onAuthChange:l,onPrint:j,onPDF:k,lang:"bn",children:[c&&e.jsx("div",{style:{margin:"8px 16px 0",padding:"10px 14px",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:8,color:"#dc2626",fontSize:13,fontWeight:500},children:c}),h==="basic"&&e.jsx(Se,{minutes:a,setMinutes:d}),h==="opening"&&e.jsx(De,{minutes:a,setMinutes:f}),h==="discussion"&&e.jsx(Me,{minutes:a,setMinutes:f}),h==="photo"&&e.jsx(Ce,{minutes:a,setMinutes:f}),h==="notice"&&e.jsx("div",{id:"printable-area",ref:S,children:e.jsx(K,{minutes:a,printOption:"notice",authorization:s})}),h==="minutes"&&e.jsx("div",{id:"printable-area",ref:S,children:e.jsx(K,{minutes:a,authorization:s,viewSections:{basic:!0,agenda:!0,attendance:!1,notice:!1,approval:!1}})}),h==="participants"&&e.jsx("div",{id:"printable-area",ref:S,children:e.jsx(Fe,{minutes:a,setMinutes:d})})]})]})}export{nt as default};
