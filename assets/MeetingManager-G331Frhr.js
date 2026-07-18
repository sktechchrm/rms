import{U as A,r as k,u as P,j as e,V as ae,W as re,X as se,Y as oe,R as E,b as le,O as de,P as ce}from"./index-DNRIMamH.js";import{B as K,P as Q}from"./printCSS-CVcCyD98.js";import{t as u}from"./bnEnDate-DcYhykOO.js";import{u as pe}from"./useDatabase-BshpeIcG.js";import{D as F,M as ge}from"./ModuleShell-iP_czHgC.js";import"./DatabaseFactory-B-sLwujr.js";import"./AuthorityIconButton-Dk6Ao4L3.js";import"./DataUseCases-Cj_5ES-9.js";const xe=["মাসিক","দ্বি-মাসিক","ত্রৈমাসিক","অর্ধ-বার্ষিক","বার্ষিক","বিশেষ","অত্যাবশ্যক","বোর্ড","কমিটি","প্রকল্প","দল","অন্যান্য"],he=["Pending","In Progress","Completed"];A.map(t=>({id:t.id,name:t.name,address:t.address}));A.flatMap(t=>t.committees.map(n=>({id:`${t.id}__${n.id}`,name:n.name,chairperson:n.chairperson,secretary:n.secretary})));const C={organizationName:"",organizationAddress:"",department:"",meetingTitle:"",meetingEstablishDate:"",meetingType:"মাসিক",meetingNumber:"",noticeDate:new Date().toISOString().split("T")[0],meetingDate:new Date().toISOString().split("T")[0],startTime:"",endTime:"",venue:"",virtualMeetingLink:"",meetingImage:"",chairperson:"",secretary:"",attendees:[],previousMinutesReference:"",previousMinutesApproval:"N/A",previousMinutesRejectionDetails:"",agendaItems:[],generalNotes:"",closingNotes:"",annexures:[],nextMeetingDate:"",nextMeetingTime:"",nextMeetingVenue:"",preparedBy:"",preparedByDesignation:"",preparedDate:new Date().toISOString().split("T")[0],reviewedBy:"",reviewedByDesignation:"",reviewedDate:"",approvedBy:"",approvedByDesignation:"",approvedDate:"",authority1:"",authority1Designation:"কারখানা প্রধান",authority1Date:"",authority2:"",authority2Designation:"ব্যবস্থাপক (মানবসম্পদ, প্রশাসন ও সম্মতি)",authority2Date:"",showPreparedBy:!0,showReviewedBy:!0,showApprovedBy:!0,showAuthority1:!0,showAuthority2:!0,distributionList:[]},me=(t,n)=>{if(!t||!n)return"";const[i,r]=t.split(":").map(Number),[p,a]=n.split(":").map(Number);let h=i*60+r,g=p*60+a;g<h&&(g+=1440);const x=g-h;if(x<=0)return"";const s=Math.floor(x/60),m=x%60;return s>0&&m>0?`${s} hour${s>1?"s":""} ${m} minute${m>1?"s":""}`:s>0?`${s} hour${s>1?"s":""}`:`${m} minute${m>1?"s":""}`},z=()=>`${Date.now()}-${Math.random().toString(36).substr(2,9)}`,ee=t=>{const n=t.filter(a=>a.attendanceStatus==="Present").length,i=t.filter(a=>a.attendanceStatus==="Absent").length,r=t.length,p=r>0?Math.round(n/r*100):0;return{present:n,absent:i,total:r,presentPercentage:p}},be=(t="MIN")=>{const n=new Date().getFullYear(),i=Math.floor(Math.random()*1e3).toString().padStart(3,"0");return`${t}-${n}-${i}`},L=["কোরাম নিশ্চিতকরণ ও বিগত সভার কার্যবিবরণী ফলো-আপ","ঝুঁকি মূল্যায়ন ও রিস্ক রেজিস্টার পর্যালোচনা (Risk Assessment & Risk Register)","DIFE রিপোর্টিং ও বার্ষিক নিরাপত্তা প্রতিবেদন প্রস্তুতি","কমিটির নিজস্ব ওএইচএস (OSH) বাজেট ও সুপারিশ ট্র্যাকিং","ডিজিটাল সেফটি ডাটাবেজ এবং রিপোর্টিং (LIMA সিস্টেম)","অগ্নি নির্বাপণ সরঞ্জাম ও অ্যালার্ম সিস্টেমের কার্যকারিতা তদারকি","জরুরি বহির্গমন পথ (Emergency Exits) ও ইভাকুয়েশন রুট বাধামুক্ত রাখা","ফায়ার মক ড্রিল (Mock Drills) ও উদ্ধার মহড়ার মূল্যায়ন","আবহাওয়া এবং প্রাকৃতিক দুর্যোগ প্রস্তুতি (ভূমিকম্প ও বজ্রপাত)","ফ্লাড এবং আরবান ওয়াটার-লগিং (আকস্মিক বন্যা ও জলাবদ্ধতা) ঝুঁকি ব্যবস্থাপনা","কর্মক্ষেত্রের দুর্ঘটনা ও পেশাগত ব্যাধি তদন্ত","নিয়ার-মিস (Near-miss) বা 'অল্পের জন্য বেঁচে যাওয়া' ঘটনার রিপোর্টিং","নতুন মেশিনারিজ স্থাপন এবং লে-আউট পরিবর্তনজনিত ঝুঁকি মূল্যায়ন","বিপজ্জনক যন্ত্রপাতির সেফটি গার্ডিং (Machine Guarding) নিশ্চিতকরণ","কার্গো লিফট, ক্রেন এবং প্রেসার ভেসেল (বয়লার/কম্প্রেশার) পরিদর্শন","বৈদ্যুতিক সাব-স্টেশন, জেনারেটর ও ডিস্ট্রিবিউশন বোর্ডের ঝুঁকি তদারকি","ভবনের স্থায়িত্ব ও স্ট্রাকচারাল সেফটি (মেঝে, দেয়াল ও ছাদ) পরিদর্শন","ফ্লোরের তাপমাত্রা (Heat Stress), বাতাস চলাচল (Ventilation) ও লাইটিং ব্যবস্থা","তীব্র দাবদাহ (Heatwave Management) এবং চরম আবহাওয়ার প্রভাব মোকাবেলা","ক্ষতিকারক ধুলোবালি, গ্যাস, ধোঁয়া, বর্জ্য নিষ্কাশন ও শব্দ দূষণ নিয়ন্ত্রণ","আরগোনোমিক্স (Ergonomics) ও ভারী ওজন তোলার সঠিক পদ্ধতি (Manual Lifting)","কর্মক্ষেত্রে শ্রমিকদের মানসিক স্বাস্থ্য ও মনস্তাত্ত্বিক নিরাপত্তা নিশ্চিতকরণ","কর্মক্ষেত্রে যৌন হয়রানি ও মানসিক নির্যাতন প্রতিরোধে ওএইচএস (OSH) লিংক","কেমিক্যাল এবং বিপজ্জনক পদার্থের নিরাপত্তা (MSDS, লেবেলিং ও স্পিল কিট)","কনফাইন্ড স্পেস বা বদ্ধ স্থানে (ট্যাংক, সুয়ারেজ) কাজের নিরাপত্তা","উঁচুতে কাজের নিরাপত্তা (Work at Height) ও পতন রোধ ব্যবস্থা (সেফটি হার্নেস ও নেট)","বিশেষ ঝুঁকিপূর্ণ কাজের অনুমতি ব্যবস্থা (Permit to Work - PTW)","ব্যক্তিগত সুরক্ষা সরঞ্জাম (PPE) বিতরণ এবং সঠিক ব্যবহার নিশ্চিতকরণ","ফার্স্ট এইড বক্স, মেডিকেল রুম, বিশুদ্ধ খাবার পানি ও পরিচ্ছন্ন টয়লেট ব্যবস্থা","ঠিকাদার, সাব-কন্ট্রাক্টর ও আউটসোর্সিং শ্রমিকদের সেফটি প্রটোকল তদারকি","বিশেষ চাহিদা সম্পন্ন ও গর্ভবতী নারী শ্রমিকদের নিরাপত্তা","নিরাপত্তা প্রশিক্ষণ ও সচেতনতা (OSH Training) ও সেফটি সাইনেজ প্রদর্শন"],fe=["কনফারেন্স রুম","কনফারেন্স হল","বোর্ড রুম","ট্রেনিং রুম","ডাইনিং হল","কারখানার প্রধান কক্ষ","মিটিং রুম","অডিটোরিয়াম"];function ue(t){if(!t)return{male:0,female:0,total:0};const n=[];t.chairpersonGender&&n.push(t.chairpersonGender),t.secretaryGender&&n.push(t.secretaryGender);for(const i of t.members??[])i.gender&&n.push(i.gender);return{male:n.filter(i=>i==="পুরুষ").length,female:n.filter(i=>i==="মহিলা").length,total:n.length}}function ye(t,n){if(!t)return"";const[i,r]=t.split(":").map(Number),p=(i+n)%24;return`${String(p).padStart(2,"0")}:${String(r).padStart(2,"0")}`}const je=["02-21","03-26","04-14","05-01","11-07","12-16"];function H(t){if(t.getDay()===5)return!0;const n=`${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`;return je.includes(n)}function ve(t,n){if(!t)return"";const i=new Date(t);let r=0;for(;r<n;)i.setDate(i.getDate()+1),H(i)||r++;return i.toISOString().split("T")[0]}function we(t,n){if(!t)return"";const i=new Date(t);let r=0;for(;r<n;)i.setDate(i.getDate()-1),H(i)||r++;return i.toISOString().split("T")[0]}function O(t){if(!t)return"";const n=new Date(t);for(;H(n);)n.setDate(n.getDate()+1);return n.toISOString().split("T")[0]}const W=8;function ke(t){return t?parseInt(t.split(":")[0])>=12?{text:"বিকাল",bg:"#e0e7ff",color:"#4338ca"}:{text:"সকাল",bg:"#fef3c7",color:"#92400e"}:null}const Ne=["০","১","২","৩","৪","৫","৬","৭","৮","৯"];function te(t){return String(t).split("").map(n=>Ne[parseInt(n)]??n).join("")}function Se(t){return{id:z(),itemNumber:String(t),topic:"",presenter:"",timeAllocated:"",discussion:"",decisions:[],actionItems:[]}}function Ae({onSelect:t,onClose:n,currentValue:i}){const[r,p]=k.useState(""),a=k.useRef(null);k.useEffect(()=>{setTimeout(()=>a.current?.focus(),80)},[]),k.useEffect(()=>{const g=x=>{x.key==="Escape"&&n()};return window.addEventListener("keydown",g),()=>window.removeEventListener("keydown",g)},[n]);const h=r.trim()?L.filter(g=>g.toLowerCase().includes(r.toLowerCase())||g.includes(r)):L;return e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"apm-backdrop",onClick:n}),e.jsxs("div",{className:"apm-modal",role:"dialog","aria-modal":"true","aria-label":"আলোচ্যসূচি নির্বাচন",children:[e.jsxs("div",{className:"apm-header",children:[e.jsxs("div",{className:"apm-header-left",children:[e.jsx("i",{className:"ti ti-list-check"}),e.jsx("span",{children:"আলোচ্যসূচি নির্বাচন করুন"}),e.jsxs("span",{className:"apm-count",children:[h.length,"টি বিষয়"]})]}),e.jsx("button",{className:"apm-close",onClick:n,title:"বন্ধ করুন",children:e.jsx("i",{className:"ti ti-x"})})]}),e.jsxs("div",{className:"apm-search-wrap",children:[e.jsx("i",{className:"ti ti-search apm-search-icon"}),e.jsx("input",{ref:a,type:"text",className:"apm-search",placeholder:"বিষয় খুঁজুন...",value:r,onChange:g=>p(g.target.value),lang:"bn"}),r&&e.jsx("button",{className:"apm-search-clear",onClick:()=>p(""),children:e.jsx("i",{className:"ti ti-x"})})]}),e.jsxs("ul",{className:"apm-list",children:[h.length===0&&e.jsx("li",{className:"apm-empty",children:"কোনো বিষয় পাওয়া যায়নি"}),h.map((g,x)=>e.jsxs("li",{className:`apm-item ${i===g?"apm-item-active":""}`,onClick:()=>{t(g),n()},children:[e.jsx("span",{className:"apm-item-num",children:te(x+1)}),e.jsx("span",{className:"apm-item-text",children:g}),i===g&&e.jsx("i",{className:"ti ti-check apm-item-check"})]},x))]}),e.jsxs("div",{className:"apm-footer",children:[e.jsxs("span",{className:"apm-footer-hint",children:[e.jsx("i",{className:"ti ti-keyboard"})," Esc চাপলে বন্ধ হবে"]}),e.jsx("button",{className:"apm-cancel-btn",onClick:n,children:"বাতিল"})]})]})]})}function De({value:t,onChange:n}){const[i,r]=k.useState(!1),p=k.useCallback(a=>{n(a)},[n]);return e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"ai-wrap",children:[e.jsx("input",{type:"text",className:"bis-ag-input",value:t,onChange:a=>n(a.target.value),placeholder:"আলোচ্যসূচি লিখুন...",lang:"bn"}),e.jsx("button",{className:"ai-pick-btn",onClick:()=>r(!0),title:"তালিকা থেকে নির্বাচন করুন",type:"button",children:e.jsx("i",{className:"ti ti-layout-list"})})]}),i&&e.jsx(Ae,{currentValue:t,onSelect:p,onClose:()=>r(!1)})]})}function Te({minutes:t,setMinutes:n}){const i=P();k.useEffect(()=>{const d=A.find(b=>b.id===i.id)??A[0];d&&n({...t,organizationName:d.name,organizationAddress:d.address})},[i.id]);const r=d=>n({...t,...d}),p=()=>r({agendaItems:[...t.agendaItems,Se(t.agendaItems.length+1)]}),a=(d,b)=>r({agendaItems:t.agendaItems.map(o=>o.id===d?{...o,topic:b}:o)}),h=d=>r({agendaItems:t.agendaItems.filter(b=>b.id!==d).map((b,o)=>({...b,itemNumber:String(o+1)}))}),g=d=>{const o=((A.find(c=>c.name===t.organizationName)??A[0])?.committees??A.flatMap(c=>c.committees)).find(c=>c.id===d);o&&r({meetingTitle:o.name,meetingEstablishDate:o.establishDate??t.meetingEstablishDate,meetingNumber:be(),chairperson:o.chairperson,secretary:o.secretary,attendees:x(o)})},x=d=>{const b=[{id:z(),name:d.chairperson,designation:d.chairpersonDesignation??"",department:d.chairpersonDept??"",email:"",attendanceStatus:"Present",committeeRole:"সভাপতি"},{id:z(),name:d.secretary,designation:d.secretaryDesignation??"",department:d.secretaryDept??"",email:"",attendanceStatus:"Present",committeeRole:"সচিব"},...(d.members??[]).map(c=>({id:z(),name:c.name,designation:c.designation,department:c.section,email:"",attendanceStatus:"Present",committeeRole:c.role??"সদস্য"}))],o=Array.from({length:1},()=>({id:z(),name:"",designation:"",department:"",email:"",attendanceStatus:"Present",committeeRole:"অতিথি"}));return[...b,...o]},s=A.find(d=>d.name===t.organizationName),m=s?s.committees:A.flatMap(d=>d.committees),f=m.find(d=>d.name===t.meetingTitle),v=ue(f),w=ke(t.startTime);return e.jsxs("div",{className:"bis-wrap",children:[e.jsxs("div",{className:"bis-card",children:[e.jsxs("div",{className:"bis-card-header",children:[e.jsx("i",{className:"ti ti-calendar-event","aria-hidden":"true"}),e.jsx("span",{children:"মিটিং সময়সূচি"})]}),e.jsxs("div",{className:"bis-body",children:[e.jsxs("div",{className:"bis-field bis-r1a",children:[e.jsx("label",{className:"bis-label",children:"কমিটি নির্বাচন *"}),e.jsxs("select",{className:"bis-select",value:m.find(d=>d.name===t.meetingTitle)?.id??"",onChange:d=>g(d.target.value),children:[e.jsx("option",{value:"",children:"— কমিটি নির্বাচন করুন —"}),m.map(d=>e.jsx("option",{value:d.id,children:d.name},d.id))]}),f&&e.jsxs("p",{className:"bis-hint bis-hint-green",children:["✓ সভাপতি: ",f.chairperson," · সচিব: ",f.secretary,v.total>0&&e.jsxs("span",{children:[" · মোট ",v.total," জন (",e.jsxs("span",{style:{color:"#db2777"},children:["নারী ",v.female]})," / ",e.jsxs("span",{style:{color:"#1d4ed8"},children:["পুরুষ ",v.male]}),")"]})]})]}),e.jsxs("div",{className:"bis-field bis-r1b",children:[e.jsx("label",{className:"bis-label",children:"মিটিং ধরন *"}),e.jsx("select",{className:"bis-select",value:t.meetingType,onChange:d=>r({meetingType:d.target.value}),children:xe.map(d=>e.jsx("option",{value:d,children:d},d))})]}),e.jsxs("div",{className:"bis-field bis-r2a",children:[e.jsx("label",{className:"bis-label",children:"স্থান/রুম *"}),e.jsx("input",{type:"text",className:"bis-input",value:t.venue,onChange:d=>r({venue:d.target.value}),placeholder:"কনফারেন্স রুম",list:"bis-venue-list",lang:"bn"}),e.jsx("datalist",{id:"bis-venue-list",children:fe.map(d=>e.jsx("option",{value:d},d))})]}),e.jsxs("div",{className:"bis-field bis-r2b",children:[e.jsx("label",{className:"bis-label",children:"নোটিশের তারিখ *"}),e.jsx("input",{type:"date",className:"bis-input",value:t.noticeDate,onChange:d=>{const b=O(d.target.value),o=ve(b,W);r({noticeDate:b,meetingDate:o})}})]}),e.jsxs("div",{className:"bis-field bis-r2b-meet",children:[e.jsx("label",{className:"bis-label",children:"মিটিংয়ের তারিখ *"}),e.jsx("input",{type:"date",className:"bis-input",value:t.meetingDate,onChange:d=>{const b=O(d.target.value),o=we(b,W);r({meetingDate:b,noticeDate:o})}})]}),e.jsxs("div",{className:"bis-field bis-r2c",children:[e.jsx("label",{className:"bis-label",children:"শুরুর সময় *"}),e.jsxs("div",{style:{position:"relative"},children:[e.jsx("input",{type:"time",className:"bis-input",value:t.startTime,onChange:d=>{const b=d.target.value;r({startTime:b,endTime:ye(b,2)})},style:{paddingRight:w?72:12}}),w&&e.jsx("span",{className:"bis-time-badge",style:{background:w.bg,color:w.color},children:w.text})]})]})]})]}),e.jsxs("div",{className:"bis-card",style:{marginTop:16},children:[e.jsxs("div",{className:"bis-card-header",children:[e.jsx("i",{className:"ti ti-list-check","aria-hidden":"true"}),e.jsx("span",{children:"আলোচ্যসূচি"}),e.jsxs("button",{className:"bis-add-btn",onClick:p,children:[e.jsx("i",{className:"ti ti-plus","aria-hidden":"true"})," যোগ করুন"]})]}),e.jsxs("table",{className:"bis-ag-table",children:[e.jsxs("colgroup",{children:[e.jsx("col",{style:{width:52}}),e.jsx("col",{}),e.jsx("col",{style:{width:44}})]}),e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"ক্রম"}),e.jsx("th",{style:{textAlign:"left"},children:"আলোচ্যসূচি"}),e.jsx("th",{})]})}),e.jsxs("tbody",{children:[t.agendaItems.length===0&&e.jsx("tr",{children:e.jsx("td",{colSpan:3,className:"bis-ag-empty",children:"কোনো আলোচ্যসূচি নেই — উপরে + যোগ করুন চাপুন"})}),t.agendaItems.map((d,b)=>e.jsxs("tr",{children:[e.jsx("td",{className:"bis-ag-sl",children:te(b+1).padStart(2,"০")}),e.jsx("td",{className:"bis-ag-topic",children:e.jsx(De,{value:d.topic,onChange:o=>a(d.id,o)})}),e.jsx("td",{className:"bis-ag-del",children:e.jsx("button",{className:"bis-ag-del-btn",onClick:()=>h(d.id),title:"মুছুন",children:e.jsx("i",{className:"ti ti-x","aria-hidden":"true"})})})]},d.id))]})]})]}),e.jsx("style",{children:`
        .bis-wrap { width: 100%; display: flex; flex-direction: column; gap: 0; }

        .bis-card {
          background: #fff; border: 1px solid #e2e8f0;
          border-radius: 12px; overflow: hidden;
        }
        .bis-card-header {
          display: flex; align-items: center; gap: 9px;
          padding: 13px 22px;
          background: #f8fafc; border-bottom: 1px solid #e2e8f0;
          font-size: 11.5px; font-weight: 700; color: #64748b;
          text-transform: uppercase; letter-spacing: 0.07em;
        }
        .bis-card-header i { font-size: 16px; color: #94a3b8; }

        .bis-body {
          padding: 22px;
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 18px;
        }
        .bis-r1a { grid-column: span 4; }
        .bis-r1b { grid-column: span 2; }
        .bis-r2a { grid-column: span 1; }
        .bis-r2b { grid-column: span 1; }
        .bis-r2b-meet { grid-column: span 1; }
        .bis-r2c { grid-column: span 1; }

        @media (min-width: 640px) and (max-width: 1023px) {
          .bis-body { grid-template-columns: 1fr 1fr; gap: 14px; padding: 18px; }
          .bis-r1a { grid-column: span 1; }
          .bis-r1b { grid-column: span 1; }
          .bis-r2a { grid-column: span 1; }
          .bis-r2b { grid-column: span 1; }
          .bis-r2b-meet { grid-column: span 1; }
          .bis-r2c { grid-column: span 1; }
        }
        @media (max-width: 639px) {
          .bis-body { grid-template-columns: 1fr; gap: 12px; padding: 14px; }
          .bis-r1a, .bis-r1b, .bis-r2a, .bis-r2b, .bis-r2b-meet, .bis-r2c { grid-column: 1 / -1; }
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
          border-radius: 6px; padding: 6px 11px; line-height: 1.5;
        }
        .bis-hint-green { background: #f0fdf4; border-color: #bbf7d0; color: #065f46; }

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

        /* ── AgendaInput row ── */
        .ai-wrap {
          display: flex; align-items: center; gap: 0;
        }
        .bis-ag-input {
          flex: 1; padding: 8px 10px;
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

        /* Modal trigger button */
        .ai-pick-btn {
          flex-shrink: 0;
          width: 30px; height: 30px;
          display: inline-flex; align-items: center; justify-content: center;
          background: #f1f5f9; border: 1px solid #e2e8f0;
          border-radius: 6px; color: #64748b;
          cursor: pointer; font-size: 15px;
          transition: background 0.12s, color 0.12s;
          margin-right: 4px;
          appearance: none;
        }
        .ai-pick-btn:hover { background: #dbeafe; color: #1d4ed8; border-color: #bfdbfe; }

        .bis-ag-del { text-align: center; padding: 4px 8px; }
        .bis-ag-del-btn {
          -webkit-appearance: none !important;
          appearance: none !important;
          width: 28px; height: 28px;
          display: inline-flex; align-items: center; justify-content: center;
          background-color: #fef2f2 !important;
          border: 1.5px solid #fca5a5 !important;
          border-radius: 6px; color: #ef4444 !important;
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

        /* ══════════════════════════════════════════════
           AgendaPickerModal
        ══════════════════════════════════════════════ */
        .apm-backdrop {
          position: fixed; inset: 0;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(3px);
          z-index: 10000;
          animation: apm-fade-in 0.15s ease;
        }
        @keyframes apm-fade-in { from { opacity: 0; } to { opacity: 1; } }

        .apm-modal {
          position: fixed;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: min(640px, 95vw);
          max-height: 80vh;
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.22);
          z-index: 10001;
          display: flex; flex-direction: column;
          overflow: hidden;
          animation: apm-slide-up 0.18s ease;
        }
        @keyframes apm-slide-up {
          from { opacity: 0; transform: translate(-50%, -47%); }
          to   { opacity: 1; transform: translate(-50%, -50%); }
        }

        /* Modal header */
        .apm-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
        }
        .apm-header-left {
          display: flex; align-items: center; gap: 10px;
          font-size: 14px; font-weight: 700; color: #1e293b;
        }
        .apm-header-left i { font-size: 18px; color: #3b82f6; }
        .apm-count {
          font-size: 11px; font-weight: 600;
          background: #dbeafe; color: #1d4ed8;
          padding: 2px 8px; border-radius: 20px;
        }
        .apm-close {
          width: 32px; height: 32px;
          display: inline-flex; align-items: center; justify-content: center;
          background: #f1f5f9; border: 1px solid #e2e8f0;
          border-radius: 8px; color: #64748b;
          cursor: pointer; font-size: 16px;
          transition: background 0.12s;
          appearance: none;
        }
        .apm-close:hover { background: #fee2e2; color: #ef4444; border-color: #fca5a5; }

        /* Search bar */
        .apm-search-wrap {
          position: relative;
          padding: 14px 20px;
          border-bottom: 1px solid #f1f5f9;
        }
        .apm-search-icon {
          position: absolute; left: 34px; top: 50%; transform: translateY(-50%);
          color: #94a3b8; font-size: 15px; pointer-events: none;
        }
        .apm-search {
          width: 100%; padding: 10px 40px;
          font-size: 14px; font-family: inherit;
          border: 1.5px solid #e2e8f0; border-radius: 10px;
          background: #f8fafc; color: #1e293b;
          outline: none; box-sizing: border-box;
          transition: border-color 0.14s, box-shadow 0.14s;
        }
        .apm-search:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
          background: #fff;
        }
        .apm-search::placeholder { color: #94a3b8; }
        .apm-search-clear {
          position: absolute; right: 34px; top: 50%; transform: translateY(-50%);
          width: 22px; height: 22px;
          display: inline-flex; align-items: center; justify-content: center;
          background: #e2e8f0; border: none; border-radius: 50%;
          color: #64748b; cursor: pointer; font-size: 11px;
          transition: background 0.12s;
          appearance: none;
        }
        .apm-search-clear:hover { background: #cbd5e1; }

        /* List */
        .apm-list {
          flex: 1; overflow-y: auto;
          margin: 0; padding: 8px 0;
          list-style: none;
        }
        .apm-list::-webkit-scrollbar { width: 5px; }
        .apm-list::-webkit-scrollbar-track { background: transparent; }
        .apm-list::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }
        .apm-list::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }

        .apm-item {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 11px 20px;
          cursor: pointer;
          transition: background 0.1s;
          border-bottom: 1px solid #f8fafc;
        }
        .apm-item:last-child { border-bottom: none; }
        .apm-item:hover { background: #eff6ff; }
        .apm-item-active { background: #f0fdf4 !important; }
        .apm-item-active:hover { background: #dcfce7 !important; }

        .apm-item-num {
          flex-shrink: 0;
          min-width: 24px; height: 24px;
          display: inline-flex; align-items: center; justify-content: center;
          background: #f1f5f9; border-radius: 50%;
          font-size: 10px; font-weight: 700; color: #64748b;
          margin-top: 1px;
        }
        .apm-item-active .apm-item-num {
          background: #bbf7d0; color: #065f46;
        }
        .apm-item-text {
          flex: 1; font-size: 13px; line-height: 1.6; color: #1e293b;
        }
        .apm-item:hover .apm-item-text { color: #1d4ed8; }
        .apm-item-check {
          flex-shrink: 0; font-size: 15px;
          color: #16a34a; margin-top: 3px;
        }

        .apm-empty {
          text-align: center; padding: 40px;
          color: #94a3b8; font-size: 13px; font-style: italic;
        }

        /* Modal footer */
        .apm-footer {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 20px;
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
        }
        .apm-footer-hint {
          font-size: 11.5px; color: #94a3b8;
          display: flex; align-items: center; gap: 5px;
        }
        .apm-footer-hint i { font-size: 13px; }
        .apm-cancel-btn {
          padding: 6px 18px; font-size: 13px; font-weight: 600;
          background: #fff; color: #64748b;
          border: 1px solid #e2e8f0; border-radius: 8px;
          cursor: pointer; font-family: inherit;
          transition: background 0.12s;
          appearance: none;
        }
        .apm-cancel-btn:hover { background: #f1f5f9; }
      `})]})}const ze=k.memo(Te),_=()=>({id:z(),name:"",designation:"",department:"",email:"",attendanceStatus:"Present",committeeRole:"অতিথি"});function Ie(t){const n=t.filter(r=>r.committeeRole!=="অতিথি"),i=t.filter(r=>r.committeeRole==="অতিথি");return{members:n,guests:i}}function G({status:t,onToggle:n}){const i=t==="Present";return e.jsxs("button",{type:"button",onClick:n,"aria-pressed":i,"aria-label":i?"উপস্থিত — পরিবর্তন করতে ক্লিক করুন":"অনুপস্থিত — পরিবর্তন করতে ক্লিক করুন",className:"ae-toggle",style:{color:i?"#15803d":"#dc2626"},children:[e.jsx("span",{className:"ae-toggle-box",style:i?{background:"#16a34a",borderColor:"#16a34a"}:{background:"#fff",borderColor:"#dc2626"},children:i&&e.jsx("svg",{width:"9",height:"9",viewBox:"0 0 16 16",fill:"none","aria-hidden":"true",children:e.jsx("path",{d:"M2 8.5L6 12.5L14 3.5",stroke:"white",strokeWidth:"2.4",strokeLinecap:"round",strokeLinejoin:"round"})})}),i?"উপস্থিত":"অনুপস্থিত"]})}function Be({minutes:t,setMinutes:n}){const{members:i,guests:r}=Ie(t.attendees),p=t.attendees.filter(s=>s.committeeRole==="অতিথি").length;k.useEffect(()=>{p===0&&n({...t,attendees:[...t.attendees,_()]})},[]);const a=(s,m)=>{n({...t,attendees:t.attendees.map(f=>f.id===s?{...f,...m}:f)})},h=s=>{const m=t.attendees.find(f=>f.id===s);m&&a(s,{attendanceStatus:m.attendanceStatus==="Present"?"Absent":"Present"})},g=()=>{n({...t,attendees:[...t.attendees,_()]})},x=s=>{n({...t,attendees:t.attendees.filter(m=>m.id!==s)})};return e.jsxs("div",{className:"ae-wrap",children:[i.length>0&&e.jsxs("div",{className:"ae-card",children:[e.jsxs("div",{className:"ae-card-header",children:[e.jsx("i",{className:"ti ti-users","aria-hidden":"true"}),e.jsxs("span",{children:["কমিটি সদস্য (",i.length," জন)"]})]}),e.jsxs("table",{className:"ae-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{style:{width:44},children:"ক্রম"}),e.jsx("th",{style:{textAlign:"left"},children:"নাম"}),e.jsx("th",{style:{textAlign:"left"},children:"পদবি"}),e.jsx("th",{style:{textAlign:"left"},children:"বিভাগ / সেকশন"}),e.jsx("th",{style:{width:90},children:"ভূমিকা"}),e.jsx("th",{style:{width:130},children:"উপস্থিতি"})]})}),e.jsx("tbody",{children:i.map((s,m)=>e.jsxs("tr",{children:[e.jsx("td",{className:"ae-sl",children:m+1}),e.jsx("td",{children:s.name}),e.jsx("td",{children:s.designation}),e.jsx("td",{children:s.department}),e.jsx("td",{style:{textAlign:"center"},children:s.committeeRole||"—"}),e.jsx("td",{style:{textAlign:"center"},children:e.jsx(G,{status:s.attendanceStatus,onToggle:()=>s.id&&h(s.id)})})]},s.id??m))})]})]}),e.jsxs("div",{className:"ae-card",style:{marginTop:i.length>0?16:0},children:[e.jsxs("div",{className:"ae-card-header",children:[e.jsx("i",{className:"ti ti-user-plus","aria-hidden":"true"}),e.jsxs("span",{children:["অতিথি (",r.length," জন)"]}),e.jsxs("button",{type:"button",className:"ae-add-btn",onClick:g,children:[e.jsx("i",{className:"ti ti-plus","aria-hidden":"true"})," নতুন অতিথি যোগ করুন"]})]}),e.jsxs("table",{className:"ae-table",children:[e.jsxs("colgroup",{children:[e.jsx("col",{style:{width:44}}),e.jsx("col",{}),e.jsx("col",{}),e.jsx("col",{}),e.jsx("col",{style:{width:130}}),e.jsx("col",{style:{width:44}})]}),e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"ক্রম"}),e.jsx("th",{style:{textAlign:"left"},children:"নাম"}),e.jsx("th",{style:{textAlign:"left"},children:"পদবি"}),e.jsx("th",{style:{textAlign:"left"},children:"বিভাগ / প্রতিষ্ঠান"}),e.jsx("th",{children:"উপস্থিতি"}),e.jsx("th",{})]})}),e.jsxs("tbody",{children:[r.length===0&&e.jsx("tr",{children:e.jsx("td",{colSpan:6,className:"ae-empty",children:"কোনো অতিথি নেই — উপরে + নতুন অতিথি যোগ করুন চাপুন"})}),r.map((s,m)=>e.jsxs("tr",{children:[e.jsx("td",{className:"ae-sl",children:m+1}),e.jsx("td",{children:e.jsx("input",{type:"text",className:"ae-input",lang:"bn",value:s.name,placeholder:"অতিথির নাম",onChange:f=>s.id&&a(s.id,{name:f.target.value})})}),e.jsx("td",{children:e.jsx("input",{type:"text",className:"ae-input",lang:"bn",value:s.designation,placeholder:"পদবি",onChange:f=>s.id&&a(s.id,{designation:f.target.value})})}),e.jsx("td",{children:e.jsx("input",{type:"text",className:"ae-input",lang:"bn",value:s.department,placeholder:"বিভাগ / প্রতিষ্ঠানের নাম",onChange:f=>s.id&&a(s.id,{department:f.target.value})})}),e.jsx("td",{style:{textAlign:"center"},children:e.jsx(G,{status:s.attendanceStatus,onToggle:()=>s.id&&h(s.id)})}),e.jsx("td",{style:{textAlign:"center"},children:e.jsx("button",{type:"button",className:"ae-del-btn",onClick:()=>s.id&&x(s.id),title:"মুছুন","aria-label":"অতিথি মুছুন",children:e.jsx("i",{className:"ti ti-x","aria-hidden":"true"})})})]},s.id??m))]})]})]}),e.jsx("style",{children:`
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
      `})]})}const Me="সম্মানিত উপস্থিত সকলকে স্বাগত জানিয়ে সভাপতি সভার কার্যক্রম শুরু করেন। তিনি সকলের উপস্থিতির জন্য ধন্যবাদ জ্ঞাপন করেন এবং আজকের সভার মূল আলোচ্যসূচি সম্পর্কে সংক্ষিপ্ত ধারণা প্রদান করেন।",Ce="আলোচ্যসূচির সকল বিষয়ে আলোচনা সম্পন্ন হওয়ার পর সভাপতি উপস্থিত সকল সদস্যকে তাঁদের গঠনমূলক মতামত ও সক্রিয় অংশগ্রহণের জন্য ধন্যবাদ জানান। পরবর্তী সভার তারিখ ও সময় যথাসময়ে জানানো হবে মর্মে উল্লেখ করে তিনি সভার সমাপ্তি ঘোষণা করেন।";function $e({label:t,variant:n="orange"}){const r={default:{bg:"#f1f5f9",border:"#94a3b8",color:"#475569"},blue:{bg:"#eff6ff",border:"#3b82f6",color:"#1d4ed8"},green:{bg:"#f0fdf4",border:"#22c55e",color:"#065f46"},purple:{bg:"#faf5ff",border:"#a855f7",color:"#6b21a8"},orange:{bg:"#fff7ed",border:"#f97316",color:"#9a3412"}}[n];return e.jsx("div",{className:"ocs-block-title",style:{background:r.bg,borderLeftColor:r.border,color:r.color},children:t})}function J({label:t,variant:n,value:i,onChange:r,placeholder:p,template:a}){const h=()=>{r(i?`${i}

${a}`:a)};return e.jsxs("div",{className:"ocs-card",children:[e.jsxs("div",{className:"ocs-card-head",children:[e.jsx($e,{label:t,variant:n}),e.jsx("button",{type:"button",className:"ocs-template-btn",onClick:h,children:"টেমপ্লেট যোগ করুন"})]}),e.jsx("textarea",{value:i,onChange:g=>r(g.target.value),className:"ocs-textarea",rows:9,placeholder:p,lang:"bn"})]})}function Pe({minutes:t,setMinutes:n}){return e.jsxs("div",{className:"ocs-wrap",children:[e.jsxs("div",{className:"ocs-grid",children:[e.jsx(J,{label:"উদ্বোধনী",variant:"orange",value:t.generalNotes,onChange:i=>n({...t,generalNotes:i}),placeholder:"সভার উদ্বোধনী বক্তব্য, প্রারম্ভিক মন্তব্য বা পর্যবেক্ষণ লিখুন...",template:Me}),e.jsx(J,{label:"সমাপনী",variant:"blue",value:t.closingNotes,onChange:i=>n({...t,closingNotes:i}),placeholder:"সভার সমাপনী বক্তব্য বা সংক্ষিপ্ত উপসংহার লিখুন...",template:Ce})]}),e.jsx("style",{children:`
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
      `})]})}const He=k.memo(Pe),Y={Pending:{label:"অপেক্ষমান",bg:"#fef9c3",color:"#a16207"},"In Progress":{label:"চলমান",bg:"#dbeafe",color:"#1d4ed8"},Completed:{label:"সম্পন্ন",bg:"#dcfce7",color:"#15803d"}};function Re(t,n){if(!n)return[];const i=A.find(x=>x.name===t),r=i?[i]:A;let p;for(const x of r)if(p=x.committees.find(s=>s.name===n),p)break;if(!p)return[];const a=new Set,h=[],g=x=>{x&&!a.has(x)&&(a.add(x),h.push(x))};g(p.chairperson),g(p.secretary);for(const x of p.members??[])g(x.name);return h}function Ee({minutes:t,setMinutes:n}){const i=Re(t.organizationName,t.meetingTitle),r=(a,h,g)=>n({...t,agendaItems:t.agendaItems.map(x=>{if(x.id!==a)return x;const s=x.decisions[0]||{id:z(),description:"",madeBy:""};return{...x,decisions:[{...s,[h]:g}]}})}),p=(a,h,g)=>n({...t,agendaItems:t.agendaItems.map(x=>{if(x.id!==a)return x;const s=x.actionItems[0]||{id:z(),description:"",assignedTo:"",dueDate:"",priority:"Medium",status:"Pending"};return{...x,actionItems:[{...s,[h]:g}]}})});return t.agendaItems.length===0?e.jsxs("div",{className:"dd-empty",children:[e.jsx("p",{children:'কোনো আলোচ্যসূচি নেই। প্রথমে "আলোচ্যসূচি" ধাপে গিয়ে আইটেম যুক্ত করুন।'}),e.jsx("style",{children:".dd-empty { text-align: center; padding: 48px 16px; color: #94a3b8; font-size: 13px; }"})]}):e.jsxs("div",{className:"dd-wrap",children:[e.jsxs("table",{className:"dd-table",children:[e.jsxs("colgroup",{children:[e.jsx("col",{style:{width:"5%"}}),e.jsx("col",{style:{width:"25%"}}),e.jsx("col",{style:{width:"35%"}}),e.jsx("col",{style:{width:"13%"}}),e.jsx("col",{style:{width:"10%"}}),e.jsx("col",{style:{width:"12%"}})]}),e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"নং"}),e.jsx("th",{style:{textAlign:"left"},children:"আলোচ্যসূচি"}),e.jsx("th",{style:{textAlign:"left"},children:"আলোচনা ও সিদ্ধান্ত"}),e.jsx("th",{className:"dd-col-assignee",style:{textAlign:"left"},children:"দায়িত্ব"}),e.jsx("th",{className:"dd-col-due",children:"সময়সীমা"}),e.jsx("th",{children:"অবস্থা"})]})}),e.jsx("tbody",{children:t.agendaItems.map((a,h)=>{const g=a.decisions[0],x=a.actionItems[0];return e.jsxs("tr",{children:[e.jsx("td",{className:"dd-num","data-label":"ক্রম",children:h+1}),e.jsx("td",{className:"dd-readonly","data-label":"আলোচ্যসূচি",children:a.topic?e.jsx("div",{className:"dd-topic",children:a.topic}):e.jsx("span",{className:"dd-muted",children:"—"})}),e.jsx("td",{"data-label":"আলোচনা ও সিদ্ধান্ত",children:e.jsx("textarea",{value:g?.description??"",onChange:s=>r(a.id,"description",s.target.value),placeholder:"আলোচনা ও গৃহীত সিদ্ধান্ত লিখুন...",className:"dd-cell-input",rows:3,lang:"bn"})}),e.jsxs("td",{className:"dd-col-assignee","data-label":"দায়িত্ব",children:[e.jsx("input",{list:`dd-people-${a.id}`,value:x?.assignedTo??"",onChange:s=>p(a.id,"assignedTo",s.target.value),placeholder:"নাম / বিভাগ",className:"dd-cell-input",lang:"bn"}),e.jsx("datalist",{id:`dd-people-${a.id}`,children:i.map(s=>e.jsx("option",{value:s},s))})]}),e.jsx("td",{className:"dd-col-due","data-label":"সময়সীমা",children:e.jsx("input",{type:"date",value:x?.dueDate??"",onChange:s=>p(a.id,"dueDate",s.target.value),className:"dd-cell-input dd-date-input"})}),e.jsx("td",{"data-label":"অবস্থা",children:e.jsx("div",{className:"dd-status-group",children:he.map(s=>e.jsxs("label",{className:"dd-status-check",children:[e.jsx("input",{type:"checkbox",checked:x?.status===s,onChange:()=>{x?.status===s?n({...t,agendaItems:t.agendaItems.map(m=>m.id===a.id?{...m,actionItems:[]}:m)}):p(a.id,"status",s)}}),e.jsx("span",{style:{color:Y[s].color},children:Y[s].label})]},s))})})]},a.id)})})]}),e.jsx("style",{children:`
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
      `})]})}const Fe=k.memo(Ee);function Le({minutes:t,setMinutes:n}){const[i,r]=k.useState(!1),p=k.useRef(null),a=1200,h=800,g=Array.isArray(t.meetingImage)?t.meetingImage:t.meetingImage?[t.meetingImage]:[],x=f=>new Promise(v=>{const w=new FileReader;w.onload=d=>{const b=new Image;b.onload=()=>{const o=p.current;if(!o)return;const c=o.getContext("2d",{alpha:!1});if(!c)return;o.width=a,o.height=h;const y=Math.max(a/b.width,h/b.height),D=a/2-b.width/2*y,N=h/2-b.height/2*y;c.fillStyle="#FFFFFF",c.fillRect(0,0,a,h),c.drawImage(b,D,N,b.width*y,b.height*y);const B=t.meetingDate||new Date().toISOString().split("T")[0],l=t.startTime||new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",hour12:!1}),j=`${B.split("-").reverse().join("/")} ${l}`;c.save(),c.font='bold 32px "Courier New", Courier, monospace',c.textAlign="right",c.shadowColor="rgba(0, 0, 0, 0.8)",c.shadowBlur=4,c.lineWidth=4,c.strokeStyle="rgba(0, 0, 0, 0.6)",c.strokeText(j,a-40,h-40),c.shadowBlur=0,c.fillStyle="#ff9800",c.fillText(j,a-40,h-40),c.restore(),v(o.toDataURL("image/jpeg",.85))},b.src=d.target?.result},w.readAsDataURL(f)}),s=async f=>{const v=f.target.files;if(!v||v.length===0)return;r(!0);const w=[];for(let d=0;d<v.length;d++){const b=await x(v[d]);w.push(b)}n({...t,meetingImage:[...g,...w]}),r(!1),f.target.value=""},m=f=>{const v=g.filter((w,d)=>d!==f);n({...t,meetingImage:v[0]??""})};return e.jsxs("div",{className:"w-full",children:[e.jsx("canvas",{ref:p,className:"hidden"}),e.jsx("div",{className:"bg-white rounded-2xl border border-slate-200 overflow-hidden",children:e.jsx("div",{className:"p-4 sm:p-6",children:e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6",children:[e.jsxs("div",{className:"sm:col-span-1 flex flex-row sm:flex-col gap-3",children:[e.jsxs("div",{className:"flex-1 p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-200",children:[e.jsxs("label",{className:"text-[11px] font-black text-slate-400 uppercase flex items-center gap-2 mb-2",children:[e.jsx(ae,{"aria-hidden":"true"})," তারিখ ও সময়"]}),e.jsx("p",{className:"text-sm font-bold text-slate-700",children:t.meetingDate||"—"}),e.jsx("p",{className:"text-xs text-slate-500 font-medium",children:t.startTime||"—"})]}),e.jsx("input",{id:"multi-upload",type:"file",accept:"image/*",multiple:!0,onChange:s,className:"hidden"}),e.jsxs("label",{htmlFor:"multi-upload",className:"flex-1 flex flex-col items-center justify-center min-h-[100px] sm:min-h-[140px] border-2 border-dashed border-slate-200 rounded-2xl hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer group",children:[e.jsx("div",{className:"p-3 bg-white shadow-md rounded-full mb-2 group-hover:scale-110 transition-transform",children:e.jsx(re,{className:"text-indigo-600"})}),e.jsx("span",{className:"text-xs font-bold text-slate-600",children:"ফটো যোগ করুন"}),e.jsx("span",{className:"text-[10px] text-slate-400 mt-1 uppercase font-bold",children:"একাধিক নির্বাচন"}),g.length>0&&e.jsxs("span",{className:"mt-1 text-[10px] font-bold text-indigo-500",children:[g.length," টি ফটো"]})]})]}),e.jsx("div",{className:"sm:col-span-3",children:g.length>0?e.jsxs("div",{className:"grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1",children:[g.map((f,v)=>e.jsxs("div",{className:"relative group rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50",children:[e.jsx("img",{src:f,alt:`Photo ${v+1}`,className:"w-full aspect-[3/2] object-cover"}),e.jsx("div",{className:"absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center",children:e.jsx("button",{onClick:()=>m(v),className:"p-3 bg-white text-rose-600 rounded-full shadow-xl hover:bg-rose-600 hover:text-white transition-all",children:e.jsx(se,{size:16})})}),e.jsxs("div",{className:"absolute top-2 left-2 px-2 py-0.5 bg-black/60 rounded text-[10px] text-white font-black",children:["#",v+1]})]},v)),i&&e.jsxs("div",{className:"w-full aspect-[3/2] bg-indigo-50 rounded-xl border-2 border-dashed border-indigo-200 flex flex-col items-center justify-center animate-pulse",children:[e.jsx("div",{className:"w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"}),e.jsx("p",{className:"text-[10px] font-black text-indigo-400 uppercase",children:"প্রক্রিয়াকরণ..."})]})]}):e.jsxs("div",{className:"w-full min-h-[220px] sm:min-h-[350px] bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300",children:[e.jsx(oe,{size:36,className:"opacity-20 mb-3"}),e.jsx("p",{className:"text-sm font-bold text-slate-400",children:"কোনো ফটো নেই"}),e.jsx("p",{className:"text-xs text-slate-300 mt-1",children:"বাম দিক থেকে ফটো যোগ করুন"})]})})]})})})]})}const Oe=["রবিবার","সোমবার","মঙ্গলবার","বুধবার","বৃহস্পতিবার","শুক্রবার","শনিবার"],We=["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"],_e=t=>{if(!t)return"";const n=new Date(t),i=Oe[n.getDay()],r=u(String(n.getDate()).padStart(2,"0")),p=We[n.getMonth()],a=u(n.getFullYear());return`${i}, ${r} ${p} ${a}`},Ge=t=>({Present:"উপস্থিত",Absent:"অনুপস্থিত"})[t]??t;function Je(t){const n=t.filter(r=>r.committeeRole!=="অতিথি"),i=t.filter(r=>r.committeeRole==="অতিথি");return{members:n,guests:i}}function U({rows:t}){return e.jsxs("table",{className:"pl-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{style:{width:"6%"},children:"ক্রম"}),e.jsx("th",{style:{width:"20%",textAlign:"left"},children:"নাম"}),e.jsx("th",{style:{width:"16%",textAlign:"left"},children:"পদবি"}),e.jsx("th",{style:{width:"18%",textAlign:"left"},children:"বিভাগ / সেকশন"}),e.jsx("th",{style:{width:"12%"},children:"কমিটিতে ভূমিকা"}),e.jsx("th",{style:{width:"12%"},children:"উপস্থিতি"}),e.jsx("th",{style:{width:"16%"},children:"স্বাক্ষর"})]})}),e.jsx("tbody",{children:t.map((n,i)=>e.jsxs("tr",{children:[e.jsx("td",{style:{textAlign:"center"},children:u(i+1)}),e.jsx("td",{children:n.name}),e.jsx("td",{children:n.designation}),e.jsx("td",{children:n.department}),e.jsx("td",{style:{textAlign:"center"},children:n.committeeRole||"—"}),e.jsx("td",{style:{textAlign:"center",fontWeight:600},children:n.name?Ge(n.attendanceStatus):""}),e.jsx("td",{})]},n.id??i))})]})}function Ye({minutes:t}){const[n,i]=E.useState(()=>{try{return localStorage.getItem("rms-theme")==="dark"}catch{return!1}});E.useEffect(()=>{const s=()=>{try{i(localStorage.getItem("rms-theme")==="dark")}catch{}};return window.addEventListener("storage",s),()=>window.removeEventListener("storage",s)},[]);const{members:r,guests:p}=Je(t.attendees),a=ee(r),h=t.attendees.length,g=h<=15?12:h<=22?11:h<=30?10:9,x=h<=15?9:h<=22?7:h<=30?5:4;return e.jsxs("div",{className:"pl-page",style:{"--pl-row-font":`${g}px`,"--pl-row-pad":`${x}px 8px`,background:"#ffffff",color:"#000000"},children:[e.jsxs("div",{className:"pl-header",children:[e.jsx("h1",{className:"pl-org",children:t.organizationName}),t.organizationAddress&&e.jsx("p",{className:"pl-org-addr",children:t.organizationAddress}),e.jsx("h2",{className:"pl-title",children:(t.meetingTitle||"--")+" এর উপস্থিতি তালিকা"}),e.jsxs("p",{className:"pl-date",children:["তারিখ: ",_e(t.meetingDate)]})]}),e.jsxs("p",{className:"pl-summary",children:["মোট: ",u(a.total)," |  উপস্থিত: ",u(a.present)," |  অনুপস্থিত: ",u(a.absent)," |  উপস্থিতির হার: ",u(a.presentPercentage),"%"]}),r.length>0&&e.jsxs("div",{className:"pl-section",style:{marginBottom:p.length>0?"20px":"0"},children:[e.jsxs("p",{className:"pl-section-title",children:["কমিটি সদস্য (",u(r.length)," জন)"]}),e.jsx(U,{rows:r})]}),p.length>0&&e.jsxs("div",{className:"pl-section",children:[e.jsxs("p",{className:"pl-section-title",children:["অতিথি (",u(p.length)," জন)"]}),e.jsx(U,{rows:p})]}),e.jsx("style",{children:`
        ${K}
        ${Q}

        .pl-page { width: 100%; max-width: 100%; margin: 0; font-family: 'Noto Sans Bengali', Arial, sans-serif; padding: 24px 32px; box-sizing: border-box; }
        .pl-header { text-align: center; margin-bottom: 18px; }
        .pl-org { font-size: 18px; font-weight: 700; margin: 0; word-break: keep-all; white-space: pre-wrap; }
        .pl-org-addr { font-size: 12px; color: #475569; margin: 2px 0 10px; }
        .pl-title { font-size: 15px; font-weight: 700; margin: 10px 0 4px; border-bottom: 2px solid #000; display: inline-block; padding-bottom: 4px; }
        .pl-date { font-size: 12.5px; margin: 4px 0 0; }
        .pl-summary { font-size: 12px; font-weight: 600; margin-bottom: 12px; }
        .pl-section-title { font-size: 13px; font-weight: 700; margin: 0 0 6px; }
        .pl-table { width: 100%; border: 2px solid #000; border-collapse: collapse; font-size: var(--pl-row-font, 12px); }
        .pl-table th { border: 1px solid #000; padding: var(--pl-row-pad, 9px 8px); background: #e5e7eb; font-weight: 700; }
        .pl-table td { border: 1px solid #000; padding: var(--pl-row-pad, 9px 8px); line-height: 1.4; }

        /* ── Dark mode: force white/black on print preview content ── */
        /* Force white/black always — dark mode handled via inline style on wrapper */
        .pl-page * { color: #000 !important; }
        .pl-org { color: #000 !important; }
        .pl-org-addr { color: #475569 !important; }
        .pl-title { color: #000 !important; border-bottom-color: #000 !important; }
        .pl-date, .pl-summary, .pl-section-title { color: #000 !important; }
        .pl-table th { background: #e5e7eb !important; color: #000 !important; border-color: #000 !important; }
        .pl-table td { color: #000 !important; border-color: #000 !important; background: #fff !important; }
        .pl-table tr:nth-child(even) td { background: #f8fafc !important; }

        @media print {
          /* Same ModuleShell overflow:hidden / narrow-column escape fix
             already applied in Printview.tsx and EmployeeNotice.tsx. */
          body * { visibility: hidden; }
          .pl-page, .pl-page * { visibility: visible; }
          .pl-page {
            position: absolute !important;
            top: 0 !important; left: 0 !important;
            max-width: none !important; width: 100% !important;
            background: white !important; color: #000 !important;
            page-break-inside: avoid; page-break-after: avoid;
          }
          .pl-table th { background: #e5e7eb !important; color: #000 !important; }
          .pl-table td { color: #000 !important; background: #fff !important; }
          html, body, body * { overflow: visible !important; }
        }
      `})]})}const ne=["রবিবার","সোমবার","মঙ্গলবার","বুধবার","বৃহস্পতিবার","শুক্রবার","শনিবার"],R=["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"],Ue=t=>{try{const n=new Date(t),i=u(n.getDate()),r=R[n.getMonth()],p=u(n.getFullYear());return`${i} ${r}, ${p}`}catch{return"[তারিখ]"}},$=t=>{if(!t)return"";const n=new Date(t),i=u(String(n.getDate()).padStart(2,"0")),r=R[n.getMonth()],p=u(n.getFullYear());return`${i} ${r} ${p}`},Ve=t=>{if(!t)return"";const n=new Date(t),i=ne[n.getDay()],r=u(String(n.getDate()).padStart(2,"0")),p=R[n.getMonth()],a=u(n.getFullYear());return`${i}, ${r} ${p} ${a}`},V=t=>{if(!t)return"";const[n,i]=t.split(":"),p=parseInt(n)%12||12;return`${u(String(p).padStart(2,"0"))}:${u(i)}`},I=t=>{if(!t)return"";const n=parseInt(t.split(":")[0]);return n>=5&&n<12?"সকাল":n>=12&&n<15?"দুপুর":n>=15&&n<18?"বিকাল":n>=18&&n<20?"সন্ধ্যা":"রাত"},Ze=t=>{if(!t)return"[সময়]";let[n,i]=t.split(":").map(Number);n=n%12||12;const r=i<10?`০${i}`:i;return u(`${n}:${r}`)},Xe=t=>t?t.replace(/(\d+)/g,n=>u(n)).replace("hours","ঘণ্টা").replace("hour","ঘণ্টা").replace("minutes","মিনিট").replace("minute","মিনিট"):"";function qe(t){if(!t)return"";try{const n=new Date(t),i=new Date(t);i.setFullYear(i.getFullYear()+2),i.setDate(i.getDate()-1);const r=p=>{const a=["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"],h=g=>String(g).split("").map(x=>"০১২৩৪৫৬৭৮৯"[+x]).join("");return`${h(p.getDate())} ${a[p.getMonth()]} ${h(p.getFullYear())}`};return`২ বছর  [${r(n)} - ${r(i)}]`}catch{return""}}const Ke=t=>({Present:"উপস্থিত",Absent:"অনুপস্থিত",Excused:"অনুমতিপ্রাপ্ত",Late:"বিলম্বিত"})[t]??t,Z=t=>!!t&&/[\u0980-\u09FFa-zA-Z0-9]/.test(t),X=t=>{if(!t)return"";const n=t.split(`
`);for(;n.length>0;){const i=n[n.length-1],r=i.trim()!==""&&!/[\u0980-\u09FFa-zA-Z0-9]/.test(i),p=i.trim()==="";if(r||p&&n.length>1)n.pop();else break}return n.join(`
`).trimEnd()};function Qe(t){if(!t)return{male:0,female:0,total:0};const n=[];t.chairpersonGender&&n.push(t.chairpersonGender),t.secretaryGender&&n.push(t.secretaryGender);for(const p of t.members??[])p.gender&&n.push(p.gender);const i=n.filter(p=>p==="পুরুষ").length,r=n.filter(p=>p==="মহিলা").length;return{male:i,female:r,total:n.length}}const et=t=>t?Array.isArray(t)?t.filter(Boolean):typeof t=="string"&&t.length>0?[t]:[]:[];function tt({status:t}){const n=[{key:"Pending",label:"অপেক্ষমান"},{key:"In Progress",label:"চলমান"},{key:"Completed",label:"সম্পন্ন"}];return e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"6px"},children:n.map(i=>{const r=t===i.key;return e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"6px"},children:[e.jsx("div",{style:{width:"13px",height:"13px",border:"1.5px solid #333",borderRadius:"2px",backgroundColor:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}),e.jsx("span",{style:{fontSize:"11px",fontWeight:r?"bold":"normal",color:r?"#000":"#555",lineHeight:"1.3"},children:i.label})]},i.key)})})}function nt({minutes:t}){const n=t.meetingDate?ne[new Date(t.meetingDate).getDay()]:"[দিন]",i=t.meetingDate?Ue(t.meetingDate):"[তারিখ]",r=t.startTime?Ze(t.startTime):"[সময়]",p={fontSize:"20px",lineHeight:"1.8",textAlign:"justify",margin:"0",fontWeight:"normal",color:"#000",paddingLeft:"0"};return e.jsxs("div",{style:{width:"100%",display:"flex",flexDirection:"column",gap:"24px"},children:[e.jsxs("p",{style:p,children:["এতদ্বারা ",t.organizationName||"[কারখানার নাম]"," এর ",t.meetingTitle||"[কমিটির নাম]"," -র সকল সদস্যগণের অবগতির জন্য জানানো যাচ্ছে যে, আগামী ",i," ইং তারিখ রোজ ",n," ",I(t.startTime)&&e.jsxs("span",{children:[I(t.startTime)," "]})," ",r," ঘটিকার সময় কারখানার অভ্যন্তরে ",t.venue||"[স্থান]"," এ একটি জরুরী আলোচনা সভা অনুষ্ঠিত হবে।"]}),e.jsxs("p",{style:p,children:["উক্ত সভায় ",t.meetingTitle||"[কমিটির নাম]"," -র সকল সদস্যগণকে যথা সময়ে নির্দিষ্ট স্থানে উপস্থিত থাকার জন্য বিশেষভাবে অনুরোধ করা হলো।"]})]})}function it({src:t,index:n}){return e.jsx("div",{style:{position:"relative",display:"block"},children:e.jsx("img",{src:t,alt:`মিটিং ছবি ${n+1}`,style:{width:"100%",height:"auto",maxHeight:"320px",border:"2px solid black",objectFit:"contain",display:"block"}})})}function q({minutes:t,printOption:n,viewSections:i,authorization:r}){const p=P(),a=ee(t.attendees),h=me(t.startTime,t.endTime),g=et(t.meetingImage),s=A.find(o=>o.name===t.organizationName)?.committees.find(o=>o.name===t.meetingTitle),m=Qe(s),f=o=>{if(i)switch(o){case"basic":return i.basic;case"attendance":return i.attendance;case"agenda":return i.agenda;case"notice":return i.notice;case"approval":return i.approval;default:return!1}return n==="all"||n==="basic"&&(o==="basic"||o==="agenda")||n==="attendance"&&o==="attendance"||n==="agenda"&&o==="agenda"||n==="notice"&&o==="notice"},v=i?i.approval:n!=="notice"&&n!=="attendance",w=!!r&&(r.visibility.hrManager||r.visibility.factoryHead||r.visibility.hoHrHead||r.visibility.headOfOperations||!!(r.visibility?.president&&r.president)||!!(r.visibility?.secretary&&r.secretary)),d=[{label:"মিটিং ধরন",value:t.meetingType},{label:"তারিখ",value:Ve(t.meetingDate)},{label:"সময়",value:e.jsxs(e.Fragment,{children:[I(t.startTime)&&e.jsxs("span",{style:{fontWeight:"600"},children:[I(t.startTime)," "]}),V(t.startTime)," –"," ",I(t.endTime)&&e.jsxs("span",{style:{fontWeight:"600"},children:[I(t.endTime)," "]}),V(t.endTime),h&&` (মোট: ${Xe(h)})`]})},{label:"স্থান",value:t.venue},{label:"সভাপতি",value:t.chairperson},{label:"সচিব",value:t.secretary},...t.meetingEstablishDate?[{label:"কমিটির মেয়াদকাল",value:qe(t.meetingEstablishDate)}]:[],...m.total>0?[{label:"মোট সদস্য",value:`নারী ${u(m.female)} জন (${u(Math.round(m.female/m.total*100))}%), পুরুষ ${u(m.male)} জন (${u(Math.round(m.male/m.total*100))}%), মোট ${u(m.total)} জন`}]:[],...t.meetingNumber?[{label:"রেফারেন্স নম্বর",value:t.meetingNumber}]:[]],b=(o=!1)=>{const c=r,y=p.authorities,D=[{show:!!(c&&c.visibility?.president&&c.president),name:c?.president??"",desig:c?.presidentDesignation??"সভাপতি",sub:t.meetingTitle,date:"",label:"--"},{show:!!(c&&c.visibility?.secretary&&c.secretary),name:c?.secretary??"",desig:c?.secretaryDesignation??"সচিব",sub:t.meetingTitle,date:"",label:"--"},{show:!!c?.visibility.hrManager,name:y.hrManager.name,desig:y.hrManager.designation,sub:"",date:"",label:"--"},{show:!!c?.visibility.factoryHead,name:y.factoryHead.name,desig:y.factoryHead.designation,sub:"",date:"",label:"--"},{show:!!c?.visibility.hoHrHead,name:y.hoHrHead.name,desig:y.hoHrHead.designation,sub:"",date:"",label:"--"},{show:!!c?.visibility.headOfOperations,name:y.headOfOperations.name,desig:y.headOfOperations.designation,sub:"",date:"",label:"--"}].filter(l=>l.show&&l.name),N=D.length,B=l=>N===1?"left":N===2?l===0?"left":"right":l===0?"left":l===N-1?"right":"center";return e.jsx("div",{style:{display:"flex",flexWrap:"wrap",justifyContent:N===1?"flex-start":"space-between",gap:"30px 15px",marginTop:"60px",width:"100%",pageBreakInside:"avoid"},children:D.map((l,j)=>e.jsxs("div",{style:{textAlign:B(j),flex:N===1?"0 1 250px":`0 1 calc(${100/N}% - 20px)`,minWidth:"180px",maxWidth:N===1?"250px":"300px"},children:[!o&&e.jsx("p",{style:{fontWeight:"bold",marginBottom:"8px",fontSize:"12px",color:"#333"},children:l.label}),e.jsx("div",{style:{height:o?"64px":"52px"}}),e.jsxs("div",{style:{borderTop:"2px solid black",paddingTop:"8px",width:"100%"},children:[e.jsx("p",{style:{fontWeight:"bold",fontSize:o?"20px":"18px",marginBottom:"2px",color:"#000"},children:l.name}),e.jsx("p",{style:{fontSize:o?"18px":"16px",color:"#444",marginBottom:l.sub?"1px":"3px"},children:l.desig}),l.sub&&e.jsx("p",{style:{fontSize:o?"16px":"14px",color:"#444",marginBottom:"3px"},children:l.sub}),!o&&e.jsxs("p",{style:{fontSize:"16px",color:"#666",whiteSpace:"nowrap"},children:["তারিখ: ",l.date?$(l.date):"___________"]})]})]},j))})};return e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"print-page",style:{padding:"24px 32px",width:"100%",maxWidth:"100%",margin:"0",backgroundColor:"white",color:"#000",fontFamily:"'Noto Sans Bengali', Arial, sans-serif",boxSizing:"border-box"},children:[e.jsxs("header",{className:"print-header",style:{textAlign:"center",borderBottom:"2px solid black",paddingBottom:"12px",marginBottom:"12px",pageBreakAfter:"avoid"},children:[e.jsx("h1",{style:{fontSize:"20px",fontWeight:"bold",color:"black",marginBottom:"4px",textTransform:"uppercase",letterSpacing:"0.5px",lineHeight:"1.2",wordBreak:"keep-all",whiteSpace:"pre-wrap"},children:t.organizationName||"ORGANIZATION NAME"}),e.jsx("p",{style:{fontSize:"12px",color:"black",marginBottom:"0",lineHeight:"1.4"},children:t.organizationAddress||"Address"})]}),e.jsxs("main",{className:"print-body",style:{minHeight:"50vh"},children:[f("notice")&&e.jsxs("div",{className:"print-single-page",style:{marginBottom:"32px"},children:[e.jsx("div",{style:{textAlign:"center",marginBottom:"50px",pageBreakAfter:"avoid"},children:e.jsx("h3",{style:{fontSize:"30px",fontWeight:"bold",textDecoration:"underline",marginBottom:"4px",lineHeight:"1.3"},children:"অফিস নোটিশ"})}),e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:"30px",fontSize:"14px",fontWeight:"600",pageBreakAfter:"avoid"},children:[e.jsxs("div",{style:{lineHeight:"1.4"},children:["সূত্র: ",t.meetingNumber||"N/A"]}),e.jsxs("div",{style:{lineHeight:"1.4"},children:["তারিখ: ",$(t.noticeDate||t.meetingDate)]})]}),e.jsx("div",{style:{marginBottom:"24px"},children:e.jsx(nt,{minutes:t})}),t.agendaItems.length>0&&(()=>{const o=t.agendaItems.length,c=o<=5?20:o<=8?17:o<=12?15:13,y=o<=5?1.8:o<=8?1.6:1.4;return e.jsxs("div",{style:{marginBottom:"32px",pageBreakInside:"avoid",marginTop:"10px"},children:[e.jsx("p",{style:{marginBottom:"15px",fontSize:"20px",lineHeight:"1.4",fontWeight:"normal",textDecoration:"underline",textUnderlineOffset:"5px"},children:"আলোচ্যসূচি:"}),e.jsx("ul",{style:{listStyleType:"disc",listStylePosition:"outside",fontSize:`${c}px`,lineHeight:y,margin:"0",padding:"0 0 0 25px"},children:t.agendaItems.map((D,N)=>e.jsx("li",{style:{marginBottom:"8px",fontStyle:"italic",fontWeight:"normal",textAlign:"justify"},children:D.topic||`বিষয় ${N+1}`},N))})]})})(),e.jsx("div",{style:{marginBottom:"20px"},children:e.jsx("p",{style:{fontSize:"20px",lineHeight:"1.4",margin:"0"},children:"ধন্যবাদান্তে,"})}),w&&e.jsx("div",{style:{marginTop:"64px",pageBreakInside:"avoid"},children:b(!0)})]}),!f("notice")&&(f("basic")||f("agenda")||f("attendance"))&&e.jsx("div",{style:{textAlign:"center",marginBottom:"20px",pageBreakAfter:"avoid"},children:e.jsx("h2",{style:{fontSize:"18px",fontWeight:"bold",marginBottom:"0",borderBottom:"2px solid black",display:"inline-block",paddingBottom:"4px",paddingLeft:"16px",paddingRight:"16px",lineHeight:"1.3"},children:(t.meetingTitle||"--")+" এর সভার কার্যবিবরণী"})}),f("basic")&&e.jsxs("div",{style:{marginBottom:"32px",pageBreakInside:"avoid"},children:[e.jsx("h3",{style:{fontWeight:"bold",borderBottom:"2px solid black",paddingBottom:"6px",marginBottom:"16px",fontSize:"15px",lineHeight:"1.3"},children:"সাধারণ তথ্য"}),e.jsx("table",{style:{width:"100%",fontSize:"13px",border:"2px solid black",borderCollapse:"collapse"},children:e.jsx("tbody",{children:d.map(({label:o,value:c},y)=>e.jsxs("tr",{style:y<d.length-1?{borderBottom:"1px solid black"}:{},children:[e.jsxs("td",{style:{fontWeight:"bold",padding:"10px",width:"35%",borderRight:"1px solid black",backgroundColor:"#f9fafb",lineHeight:"1.4"},children:[o,":"]}),e.jsx("td",{style:{padding:"10px",lineHeight:"1.4",fontWeight:o==="সভাপতি"||o==="সচিব"?"600":void 0},children:c})]},y))})}),g.length>0&&e.jsxs("div",{style:{marginTop:"20px",pageBreakInside:"avoid"},children:[e.jsx("h3",{style:{fontWeight:"bold",borderBottom:"2px solid black",paddingBottom:"6px",marginBottom:"16px",fontSize:"15px",lineHeight:"1.3"},children:"মিটিং ছবি"}),e.jsx("div",{style:{display:"grid",gridTemplateColumns:g.length===1?"1fr":"repeat(2, 1fr)",gap:"12px"},children:g.map((o,c)=>e.jsx(it,{src:o,index:c},c))})]}),Z(t.generalNotes)&&e.jsxs("div",{style:{marginTop:"20px",pageBreakInside:"avoid"},children:[e.jsx("h3",{style:{fontWeight:"bold",borderBottom:"2px solid black",paddingBottom:"6px",marginBottom:"16px",fontSize:"15px",lineHeight:"1.3"},children:"সভার উদ্বোধনী"}),e.jsx("div",{style:{padding:"12px",border:"1px solid #ccc",borderRadius:"4px",backgroundColor:"#f9fafb",fontSize:"13px",lineHeight:"1.7",textAlign:"justify"},children:X(t.generalNotes)})]})]}),f("attendance")&&e.jsxs("div",{className:"print-single-page",style:{marginBottom:"32px",pageBreakInside:"avoid"},children:[e.jsx("h3",{style:{fontWeight:"bold",borderBottom:"2px solid black",paddingBottom:"6px",marginBottom:"16px",fontSize:"15px",lineHeight:"1.3"},children:"উপস্থিতি তালিকা"}),e.jsxs("p",{style:{fontSize:"12px",marginBottom:"12px",fontWeight:"600",lineHeight:"1.6"},children:["মোট: ",u(a.total)," |  উপস্থিত: ",u(a.present)," |  অনুপস্থিত: ",u(a.absent)," |  উপস্থিতির হার: ",u(a.presentPercentage),"%"]}),e.jsxs("table",{style:{width:"100%",border:"2px solid black",fontSize:"12px",borderCollapse:"collapse"},children:[e.jsx("thead",{children:e.jsx("tr",{style:{backgroundColor:"#e5e7eb"},children:["ক্রম","নাম","পদবি","বিভাগ / সেকশন","কমিটিতে ভূমিকা","উপস্থিতি","স্বাক্ষর"].map((o,c)=>e.jsx("th",{style:{border:"1px solid black",padding:"10px",textAlign:c===0||c>=4?"center":"left",fontWeight:"bold",lineHeight:"1.4",width:c===0?"50px":c===4?"90px":c===5?"100px":c===6?"140px":void 0},children:o},c))})}),e.jsx("tbody",{children:t.attendees.map((o,c)=>e.jsxs("tr",{children:[e.jsx("td",{style:{border:"1px solid black",padding:"10px",textAlign:"center",fontWeight:"600",lineHeight:"1.4"},children:u(c+1)}),e.jsx("td",{style:{border:"1px solid black",padding:"10px",lineHeight:"1.4"},children:o.name}),e.jsx("td",{style:{border:"1px solid black",padding:"10px",lineHeight:"1.4"},children:o.designation}),e.jsx("td",{style:{border:"1px solid black",padding:"10px",lineHeight:"1.4"},children:o.department}),e.jsx("td",{style:{border:"1px solid black",padding:"10px",textAlign:"center",lineHeight:"1.4"},children:o.committeeRole||"—"}),e.jsx("td",{style:{border:"1px solid black",padding:"10px",textAlign:"center",fontWeight:"600",lineHeight:"1.4"},children:Ke(o.attendanceStatus)}),e.jsx("td",{style:{border:"1px solid black",padding:"10px"}})]},c))})]})]}),f("agenda")&&t.agendaItems.length>0&&e.jsxs("div",{style:{marginBottom:"32px"},children:[e.jsx("h3",{style:{fontWeight:"bold",borderBottom:"2px solid black",paddingBottom:"6px",marginBottom:"16px",fontSize:"15px",lineHeight:"1.3"},children:"আলোচ্যসূচি ও সিদ্ধান্ত"}),e.jsxs("table",{style:{width:"100%",border:"2px solid black",borderCollapse:"collapse",fontSize:"12px",tableLayout:"fixed"},children:[e.jsxs("colgroup",{children:[e.jsx("col",{style:{width:"5%"}}),"   ",e.jsx("col",{style:{width:"25%"}}),"  ",e.jsx("col",{style:{width:"31%"}}),"  ",e.jsx("col",{style:{width:"15%"}}),"  ",e.jsx("col",{style:{width:"11%"}}),"  ",e.jsx("col",{style:{width:"13%"}}),"  "]}),e.jsx("thead",{children:e.jsx("tr",{style:{backgroundColor:"#e5e7eb"},children:[{title:"নং",align:"center"},{title:"আলোচ্যসূচি",align:"left"},{title:"আলোচনা ও সিদ্ধান্ত",align:"left"},{title:"দায়িত্ব",align:"left"},{title:"সময়সীমা",align:"center"},{title:"অবস্থা",align:"center"}].map((o,c)=>e.jsx("th",{style:{border:"1px solid black",padding:o.align==="center"?"9px 8px":"9px 10px",textAlign:o.align,fontWeight:"bold",lineHeight:1.5,verticalAlign:"middle"},children:o.title},c))})}),e.jsx("tbody",{children:t.agendaItems.map((o,c)=>{const y=o.decisions[0],D=o.actionItems[0];return e.jsxs("tr",{style:{backgroundColor:c%2===0?"#ffffff":"#fafafa",pageBreakInside:"avoid"},children:[e.jsx("td",{style:{border:"1px solid black",padding:"10px 8px",textAlign:"center",fontWeight:"bold",fontSize:"13px",verticalAlign:"top",lineHeight:"1.4"},children:u(String(c+1).padStart(2,"0"))}),e.jsx("td",{style:{border:"1px solid black",padding:"10px",verticalAlign:"top",lineHeight:"1.7"},children:o.topic?e.jsx("div",{style:{fontWeight:"bold",fontSize:"12px"},children:o.topic}):e.jsx("span",{style:{color:"#aaa"},children:"—"})}),e.jsx("td",{style:{border:"1px solid black",padding:"10px",verticalAlign:"top",lineHeight:"1.7"},children:y?.description?e.jsx("div",{style:{fontSize:"11px",textAlign:"justify"},children:y.description}):e.jsx("span",{style:{color:"#aaa"},children:"—"})}),e.jsx("td",{style:{border:"1px solid black",padding:"10px",verticalAlign:"top",fontSize:"11px",lineHeight:"1.6"},children:D?.assignedTo||e.jsx("span",{style:{color:"#aaa"},children:"—"})}),e.jsx("td",{style:{border:"1px solid black",padding:"10px",verticalAlign:"top",fontSize:"11px",lineHeight:"1.6",textAlign:"center"},children:D?.dueDate?$(D.dueDate):e.jsx("span",{style:{color:"#aaa"},children:"—"})}),e.jsx("td",{style:{border:"1px solid black",padding:"10px",verticalAlign:"top"},children:e.jsx(tt,{status:D?.status??""})})]},c)})})]})]}),f("agenda")&&Z(t.closingNotes)&&e.jsxs("div",{style:{marginTop:"24px",pageBreakInside:"avoid"},children:[e.jsx("h3",{style:{fontWeight:"bold",borderBottom:"2px solid black",paddingBottom:"6px",marginBottom:"16px",fontSize:"15px",lineHeight:"1.3"},children:"সভার সমাপনী"}),e.jsx("div",{style:{padding:"12px",border:"1px solid #ccc",borderRadius:"4px",backgroundColor:"#f9fafb",fontSize:"13px",lineHeight:"1.7",textAlign:"justify"},children:X(t.closingNotes)})]})]}),v&&w&&e.jsx("footer",{className:"print-footer",style:{marginTop:"8px",paddingTop:"4px",pageBreakInside:"avoid"},children:b(!1)})]}),e.jsx("style",{children:`
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
      `})]})}const at=[{id:"basic",label:"প্রাথমিক তথ্য",icon:"ti-building"},{id:"opening",label:"উদ্বোধনী ও সমাপনী",icon:"ti-microphone"},{id:"discussion",label:"আলোচনা ও সিদ্ধান্ত",icon:"ti-table"},{id:"photo",label:"সভার ছবি",icon:"ti-photo"},{id:"attendance",label:"উপস্থিতি/অনুপস্থিত",icon:"ti-users"}];function xt(){const{user:t}=le(),n=P(),i=pe("meetings",n.id,t?.name??"unknown"),[r,p]=k.useState(F),[a,h]=k.useState(C),[g,x]=k.useState("basic"),s=k.useRef(null),m=g!=="basic"&&g!=="attendance"&&g!=="opening"&&g!=="discussion"&&g!=="photo",f=g==="basic"||g==="attendance"||g==="opening"||g==="discussion"||g==="photo"?g:"basic",v=l=>{const T=(A.find(S=>S.name===l.organizationName)?.committees??A.flatMap(S=>S.committees)).find(S=>S.name===l.meetingTitle);T&&p(S=>({...S,president:T.chairperson,presidentDesignation:"সভাপতি",secretary:T.secretary,secretaryDesignation:"সচিব",visibility:{...S.visibility,president:!0,secretary:!0}}))},w=l=>{h(l),v(l)},d=()=>{i.setEditingId(null),h(C),p(F),x("basic")},b=()=>window.print(),o=async()=>{const l=s.current;if(!l)return;const j=await de(l,{scale:2,useCORS:!0}),T=j.toDataURL("image/png"),S=new ce("p","mm","a4"),M=S.internal.pageSize.getWidth(),ie=j.height*M/j.width;S.addImage(T,"PNG",0,0,M,ie),S.save(`Meeting_Minutes_${a.meetingTitle||"document"}.pdf`)},c=l=>{const j=l.split(`
`);for(;j.length>0;){const T=j[j.length-1],S=T.trim()!==""&&!/[\u0980-\u09FFa-zA-Z0-9]/.test(T),M=T.trim()==="";if(S||M&&j.length>1)j.pop();else break}return j.join(`
`).trimEnd()},y=()=>({organizationName:a.organizationName,organizationAddress:a.organizationAddress,department:a.department,meetingTitle:a.meetingTitle,meetingEstablishDate:a.meetingEstablishDate,meetingType:a.meetingType,meetingNumber:a.meetingNumber,noticeDate:a.noticeDate,meetingDate:a.meetingDate,startTime:a.startTime,endTime:a.endTime,venue:a.venue,virtualMeetingLink:a.virtualMeetingLink,meetingImage:a.meetingImage,chairperson:a.chairperson,secretary:a.secretary,attendeesJson:JSON.stringify(a.attendees??[]),previousMinutesReference:a.previousMinutesReference,previousMinutesApproval:a.previousMinutesApproval,previousMinutesRejectionDetails:a.previousMinutesRejectionDetails,agendaJson:JSON.stringify(a.agendaItems??[]),generalNotes:c(a.generalNotes),closingNotes:c(a.closingNotes),annexuresJson:JSON.stringify(a.annexures??[]),nextMeetingDate:a.nextMeetingDate,nextMeetingTime:a.nextMeetingTime,nextMeetingVenue:a.nextMeetingVenue,authorizationJson:JSON.stringify(r),distributionJson:JSON.stringify(a.distributionList??[])}),D=l=>({...C,organizationName:String(l.organizationName??""),organizationAddress:String(l.organizationAddress??""),department:String(l.department??""),meetingTitle:String(l.meetingTitle??""),meetingEstablishDate:String(l.meetingEstablishDate??""),meetingType:String(l.meetingType??"মাসিক"),meetingNumber:String(l.meetingNumber??""),noticeDate:String(l.noticeDate??""),meetingDate:String(l.meetingDate??""),startTime:String(l.startTime??""),endTime:String(l.endTime??""),venue:String(l.venue??""),virtualMeetingLink:String(l.virtualMeetingLink??""),meetingImage:String(l.meetingImage??""),chairperson:String(l.chairperson??""),secretary:String(l.secretary??""),attendees:(()=>{try{return JSON.parse(String(l.attendeesJson??"[]"))}catch{return[]}})(),previousMinutesReference:String(l.previousMinutesReference??""),previousMinutesApproval:String(l.previousMinutesApproval??"N/A"),previousMinutesRejectionDetails:String(l.previousMinutesRejectionDetails??""),agendaItems:(()=>{try{return JSON.parse(String(l.agendaJson??"[]"))}catch{return[]}})(),generalNotes:String(l.generalNotes??""),closingNotes:String(l.closingNotes??""),annexures:(()=>{try{return JSON.parse(String(l.annexuresJson??"[]"))}catch{return[]}})(),nextMeetingDate:String(l.nextMeetingDate??""),nextMeetingTime:String(l.nextMeetingTime??""),nextMeetingVenue:String(l.nextMeetingVenue??""),distributionList:(()=>{try{return JSON.parse(String(l.distributionJson??"[]"))}catch{return[]}})()}),N=l=>{i.setEditingId(String(l.id??"")),h(D(l));try{const j=JSON.parse(String(l.authorizationJson??""));j&&p(j)}catch{}x("basic")},B=[{label:"নোটিশ",onClick:()=>x("notice")},{label:"সভার কার্যবিবরণী",onClick:()=>x("minutes")},{label:"উপস্থিতি তালিকা",onClick:()=>x("participants")}];return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`${K}${Q}`}),e.jsxs(ge,{moduleName:"সভার কার্যবিবরণী",moduleNameEn:"Meeting Minutes",date:a.meetingDate,onDateChange:l=>w({...a,meetingDate:l}),steps:at,activeStep:f,onStepChange:l=>x(l),billItems:B,isBillActive:m,onSave:async()=>{const l=y(),j=i.editingId?await i.update(i.editingId,l):await i.save(l);return j&&d(),j},isSaving:i.isSaving,configured:i.configured,adapterName:i.adapterName,saveDisabled:!a.meetingTitle,editingId:i.editingId,onCancelEdit:d,onReset:d,onUpdate:N,updateModule:"meetings",updateLabel:"মিটিং রেকর্ড খুঁজুন",updateSearchPlaceholder:"মিটিং শিরোনাম দিয়ে খুঁজুন...",records:i.records,isLoading:i.isLoading,onLoadRecord:l=>N(l),onDeleteRecord:i.remove,onReload:i.reload,recordLabel:l=>String(l.meetingTitle??l.id??"—"),auth:r,onAuthChange:p,onPrint:b,onPDF:o,lang:"bn",children:[g==="basic"&&e.jsx(ze,{minutes:a,setMinutes:w}),g==="attendance"&&e.jsx(Be,{minutes:a,setMinutes:h}),g==="opening"&&e.jsx(He,{minutes:a,setMinutes:h}),g==="discussion"&&e.jsx(Fe,{minutes:a,setMinutes:h}),g==="photo"&&e.jsx(Le,{minutes:a,setMinutes:h}),g==="notice"&&e.jsx("div",{id:"printable-area",ref:s,children:e.jsx(q,{minutes:a,printOption:"notice",authorization:r})}),g==="minutes"&&e.jsx("div",{id:"printable-area",ref:s,children:e.jsx(q,{minutes:a,authorization:r,viewSections:{basic:!0,agenda:!0,attendance:!1,notice:!1,approval:!0}})}),g==="participants"&&e.jsx("div",{id:"printable-area",ref:s,children:e.jsx(Ye,{minutes:a})})]})]})}export{xt as default};
