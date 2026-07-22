import{j as e,u as ue,b as ge,r as g,e as be}from"./index-C1gDPX6X.js";import{u as ye}from"./useDatabase-or6iYDUV.js";import{P as je,D as ve,M as we,t as C}from"./ModuleShell-BrW_Fl6K.js";import{t as z,f as Ne}from"./bnEnDate-DcYhykOO.js";import{B as J,P as Se}from"./printCSS-CLw4NcNg.js";import"./DatabaseFactory-BTvFa2D7.js";import"./AuthorityIconButton-p3-7nTzT.js";import"./DataUseCases-Ci0nULxK.js";const De=5;function Ce(t){return/^\d{4}-\d{2}-\d{2}$/.test(t)}function ze(t,i=[]){const s=new Date(t);return isNaN(s.getTime())?!1:s.getDay()===De?!0:i.some(l=>Ce(l)&&l===t)}function U(t,i,s=[]){if(!t)return"";const l=new Date(t);if(isNaN(l.getTime()))return"";const r=new Date(l);for(r.setDate(r.getDate()+i);ze(r.toISOString().split("T")[0],s);)r.setDate(r.getDate()+1);return r.toISOString().split("T")[0]}function u(t){return t?z(Ne(t)):""}const ce=["কারণ দর্শানোর নোটিশ।","অস্থায়ী স্থগিতাদেশ সহ কারণ দর্শানোর নোটিশ।"];function ke(t){return{slNo:t,name:"",cardNo:"",designation:"",section:""}}function H(){return{referenceNo:"",employeeName:"",cardNo:"",designation:"",section:"",joiningDate:"",showCauseDate:"",subject:"কারণ দর্শানোর নোটিশ।",complaint:"",replyDate:"",replyStatus:"",numberOfCommitteeMembers:"",notice2Date:"",committeeMembers:[],notice3Date:"",investigationReportSummary:"",recommendation:"",finalDecision:"",evaluationDate:"",date:new Date().toISOString().split("T")[0],factoryName:"",factoryAddress:""}}H();function pe(t){return t<=0?0:Math.ceil(t/2)}function Re(t,i,s){const l=String(i+1).padStart(3,"0");return`${t||"কোম্পানি"}/এইচ.আর./ডি/${z(l)}/${s}`}function Fe(t,i){const s=Math.max(0,i),l=[];for(let r=0;r<s;r++)l.push(t[r]?{...t[r],slNo:r+1}:ke(r+1));return l}function K(t,i){return t?U(t,1,i):""}const E="'Noto Sans Bengali', Arial, sans-serif",w={fontSize:13,fontWeight:600,fontFamily:E,color:"#1e293b",display:"block",marginBottom:6},N={width:"100%",padding:"9px 12px",border:"1px solid #cbd5e1",borderRadius:8,fontSize:13,fontFamily:E,background:"#fff",color:"#1e293b",outline:"none",boxSizing:"border-box"},S={marginBottom:16},Be={padding:"9px 16px",background:"#1e3a5f",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:E};function $e({data:t,setData:i,onGenerateNotice:s}){const l=(o,c)=>i({...t,[o]:c}),r=!!(t.employeeName&&t.cardNo&&t.complaint&&t.showCauseDate);return e.jsxs("div",{style:{background:"#fff",borderRadius:10,border:"1px solid #e2e8f0",padding:20},children:[e.jsxs("div",{style:{marginBottom:16,padding:"10px 14px",background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:8,fontSize:12.5,fontFamily:E,color:"#475569"},children:["সূত্র নংঃ ",e.jsx("b",{children:t.referenceNo||"সংরক্ষণের পর স্বয়ংক্রিয়ভাবে তৈরি হবে"})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(2, 1fr)",gap:16},children:[e.jsxs("div",{style:S,children:[e.jsx("label",{style:w,children:"কারণ দর্শানোর তারিখ *"}),e.jsx("input",{type:"date",value:t.showCauseDate,onChange:o=>l("showCauseDate",o.target.value),style:N}),t.showCauseDate&&e.jsxs("div",{style:{fontSize:11,color:"#64748b",marginTop:3},children:[u(t.showCauseDate)," ইং"]})]}),e.jsxs("div",{style:S,children:[e.jsx("label",{style:w,children:"কর্মীর নাম *"}),e.jsx("input",{value:t.employeeName,onChange:o=>l("employeeName",o.target.value),style:N})]}),e.jsxs("div",{style:S,children:[e.jsx("label",{style:w,children:"কার্ড নং *"}),e.jsx("input",{value:t.cardNo,onChange:o=>l("cardNo",o.target.value),style:N})]}),e.jsxs("div",{style:S,children:[e.jsx("label",{style:w,children:"পদবী"}),e.jsx("input",{value:t.designation,onChange:o=>l("designation",o.target.value),style:N})]}),e.jsxs("div",{style:S,children:[e.jsx("label",{style:w,children:"সেকশন"}),e.jsx("input",{value:t.section,onChange:o=>l("section",o.target.value),style:N})]}),e.jsxs("div",{style:S,children:[e.jsx("label",{style:w,children:"যোগদানের তারিখ"}),e.jsx("input",{type:"date",value:t.joiningDate,onChange:o=>l("joiningDate",o.target.value),style:N})]}),e.jsxs("div",{style:S,children:[e.jsx("label",{style:w,children:"বিষয় *"}),e.jsx("select",{value:t.subject,onChange:o=>l("subject",o.target.value),style:N,children:ce.map(o=>e.jsx("option",{value:o,children:o},o))})]})]}),e.jsxs("div",{style:S,children:[e.jsx("label",{style:w,children:"অভিযোগ *"}),e.jsx("textarea",{value:t.complaint,onChange:o=>l("complaint",o.target.value),rows:3,placeholder:"যে অভিযোগের ভিত্তিতে এই নোটিশ জারি করা হচ্ছে তা লিখুন",style:{...N,resize:"vertical"}})]}),e.jsx("button",{onClick:s,disabled:!r,style:{...Be,opacity:r?1:.5,cursor:r?"pointer":"not-allowed"},children:"🖨 নোটিশ ১ তৈরি করুন"})]})}const $="'Noto Sans Bengali', Arial, sans-serif",ne={fontSize:13,fontWeight:600,fontFamily:$,color:"#1e293b",display:"block",marginBottom:6},Ae={width:"100%",padding:"9px 12px",border:"1px solid #cbd5e1",borderRadius:8,fontSize:13,fontFamily:$,background:"#fff",color:"#1e293b",outline:"none",boxSizing:"border-box"},ie={marginBottom:16,maxWidth:320};function Me({data:t,setData:i}){const s=(r,o)=>i({...t,[r]:o}),l=t.replyStatus==="সন্তোষজনক";return e.jsxs("div",{style:{background:"#fff",borderRadius:10,border:"1px solid #e2e8f0",padding:20},children:[e.jsxs("div",{style:ie,children:[e.jsx("label",{style:ne,children:"জবাবের তারিখ"}),e.jsx("input",{type:"date",value:t.replyDate,onChange:r=>s("replyDate",r.target.value),style:Ae})]}),e.jsx("div",{style:{marginBottom:8,...ie},children:e.jsx("label",{style:ne,children:"জবাবের অবস্থা"})}),e.jsxs("div",{style:{display:"flex",gap:12,maxWidth:420},children:[e.jsx("button",{onClick:()=>s("replyStatus","সন্তোষজনক"),style:{flex:1,padding:"14px",borderRadius:8,fontFamily:$,fontWeight:700,fontSize:13,cursor:"pointer",border:t.replyStatus==="সন্তোষজনক"?"2px solid #16a34a":"1px solid #cbd5e1",background:t.replyStatus==="সন্তোষজনক"?"#f0fdf4":"#fff",color:t.replyStatus==="সন্তোষজনক"?"#15803d":"#64748b"},children:"✓ সন্তোষজনক"}),e.jsx("button",{onClick:()=>s("replyStatus","অসন্তোষজনক"),style:{flex:1,padding:"14px",borderRadius:8,fontFamily:$,fontWeight:700,fontSize:13,cursor:"pointer",border:t.replyStatus==="অসন্তোষজনক"?"2px solid #dc2626":"1px solid #cbd5e1",background:t.replyStatus==="অসন্তোষজনক"?"#fee2e2":"#fff",color:t.replyStatus==="অসন্তোষজনক"?"#b91c1c":"#64748b"},children:"✕ অসন্তোষজনক"})]}),l&&e.jsx("div",{style:{marginTop:14,padding:"12px 16px",background:"#f0fdf4",border:"1px solid #86efac",borderRadius:8,fontSize:13,fontFamily:$,color:"#15803d",fontWeight:600},children:"✓ জবাব সন্তোষজনক — কেস এখানেই সমাপ্ত। পরের ধাপগুলো প্রযোজ্য নয়।"})]})}const W="'Noto Sans Bengali', Arial, sans-serif",oe={fontSize:13,fontWeight:600,fontFamily:W,color:"#1e293b",display:"block",marginBottom:6},se={width:"100%",padding:"9px 12px",border:"1px solid #cbd5e1",borderRadius:8,fontSize:13,fontFamily:W,background:"#fff",color:"#1e293b",outline:"none",boxSizing:"border-box"},re={marginBottom:16},Te={padding:"9px 16px",background:"#1e3a5f",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:W};function _e({data:t,setData:i,onGenerateNotice:s}){const l=(d,m)=>i({...t,[d]:m}),r=Number(t.numberOfCommitteeMembers)||0,o=pe(r),c=r>0&&!!t.notice2Date,p=d=>{const m=Number(d)||0;i({...t,numberOfCommitteeMembers:d,committeeMembers:Fe(t.committeeMembers,m)})};return e.jsxs("div",{style:{background:"#fff",borderRadius:10,border:"1px solid #e2e8f0",padding:20},children:[e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(2, 1fr)",gap:16},children:[e.jsxs("div",{style:re,children:[e.jsx("label",{style:oe,children:"কমিটি সদস্য সংখ্যা *"}),e.jsx("input",{type:"number",min:1,value:t.numberOfCommitteeMembers,onChange:d=>p(d.target.value),style:se})]}),e.jsxs("div",{style:re,children:[e.jsx("label",{style:oe,children:"নোটিশ ইস্যু তারিখ *"}),e.jsx("input",{type:"date",value:t.notice2Date,onChange:d=>l("notice2Date",d.target.value),style:se}),t.notice2Date&&e.jsxs("div",{style:{fontSize:11,color:"#64748b",marginTop:3},children:[u(t.notice2Date)," ইং"]})]})]}),r>0&&e.jsxs("div",{style:{padding:"10px 14px",background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:8,fontSize:12.5,fontFamily:W,color:"#1e40af"},children:["মোট ",r," জন সদস্যের মধ্যে ",e.jsxs("b",{children:[o," জন"]})," শ্রমিক প্রতিনিধি হতে হবে (৫০%, ঊর্ধ্বে রাউন্ড করা)"]}),e.jsx("div",{style:{marginTop:14},children:e.jsx("button",{onClick:s,disabled:!c,style:{...Te,opacity:c?1:.5,cursor:c?"pointer":"not-allowed"},children:"🖨 নোটিশ ২ তৈরি করুন — প্রতিনিধি মনোনয়ন"})})]})}const D="'Noto Sans Bengali', Arial, sans-serif",Ee={fontSize:13,fontWeight:600,fontFamily:D,color:"#1e293b",display:"block",marginBottom:6},We={width:"100%",padding:"9px 12px",border:"1px solid #cbd5e1",borderRadius:8,fontSize:13,fontFamily:D,background:"#fff",color:"#1e293b",outline:"none",boxSizing:"border-box"},_={width:"100%",padding:"6px 8px",border:"1px solid #cbd5e1",borderRadius:6,fontSize:12.5,fontFamily:D,background:"#fff",color:"#1e293b",outline:"none",boxSizing:"border-box"},F={padding:"8px 10px",fontSize:11,fontWeight:700,fontFamily:D,color:"#374151",background:"#f8fafc",textTransform:"uppercase",borderBottom:"1px solid #e2e8f0",borderRight:"1px solid #f1f5f9"},B={padding:"6px 8px",borderBottom:"1px solid #e2e8f0",borderRight:"1px solid #f1f5f9"},Ie={padding:"9px 16px",background:"#1e3a5f",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:D};function Oe({data:t,setData:i,festivalHolidays:s,onGenerateNotice:l}){const r=Number(t.numberOfCommitteeMembers)||0,o=U(t.showCauseDate,50,s),c=(d,m,n)=>{const f=[...t.committeeMembers];f[d]={...f[d],[m]:n},i({...t,committeeMembers:f})},p=t.committeeMembers.length===r&&r>0&&t.committeeMembers.every(d=>d.name.trim()!=="")&&!!t.notice3Date;return e.jsxs("div",{style:{background:"#fff",borderRadius:10,border:"1px solid #e2e8f0",padding:20},children:[e.jsxs("div",{style:{marginBottom:16,maxWidth:280},children:[e.jsx("label",{style:Ee,children:"নোটিশ ইস্যু তারিখ *"}),e.jsx("input",{type:"date",value:t.notice3Date,onChange:d=>i({...t,notice3Date:d.target.value}),style:We}),t.notice3Date&&e.jsxs("div",{style:{fontSize:11,color:"#64748b",marginTop:3},children:[u(t.notice3Date)," ইং"]})]}),r===0&&e.jsx("div",{style:{padding:16,textAlign:"center",color:"#94a3b8",fontFamily:D,fontSize:13},children:'প্রথমে "প্রতিনিধি মনোনয়ন" ধাপে সদস্য সংখ্যা দিন — টেবিল স্বয়ংক্রিয়ভাবে তৈরি হবে'}),r>0&&e.jsx("div",{style:{overflowX:"auto"},children:e.jsxs("table",{style:{width:"100%",borderCollapse:"collapse",minWidth:700},children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{style:{...F,width:36},children:"SL"}),e.jsx("th",{style:F,children:"কর্মীর নাম"}),e.jsx("th",{style:{...F,width:120},children:"কার্ড নং"}),e.jsx("th",{style:{...F,width:150},children:"পদবী"}),e.jsx("th",{style:{...F,width:150,borderRight:"none"},children:"সেকশন"})]})}),e.jsx("tbody",{children:t.committeeMembers.map((d,m)=>e.jsxs("tr",{children:[e.jsx("td",{style:{...B,textAlign:"center",fontWeight:600},children:z(d.slNo)}),e.jsx("td",{style:B,children:e.jsx("input",{value:d.name,onChange:n=>c(m,"name",n.target.value),style:_})}),e.jsx("td",{style:B,children:e.jsx("input",{value:d.cardNo,onChange:n=>c(m,"cardNo",n.target.value),style:_})}),e.jsx("td",{style:B,children:e.jsx("input",{value:d.designation,onChange:n=>c(m,"designation",n.target.value),style:_})}),e.jsx("td",{style:{...B,borderRight:"none"},children:e.jsx("input",{value:d.section,onChange:n=>c(m,"section",n.target.value),style:_})})]},m))})]})}),o&&e.jsxs("div",{style:{marginTop:14,padding:"10px 14px",background:"#fef3c7",border:"1px solid #fde68a",borderRadius:8,fontSize:12.5,fontFamily:D,color:"#92400e"},children:["তদন্ত সময়সীমা: কারণ দর্শানোর তারিখ (",u(t.showCauseDate),") + ৫০ দিন, শুক্রবার ও ছুটির দিন বাদে = ",e.jsx("b",{children:u(o)})]}),e.jsxs("div",{style:{marginTop:14},children:[e.jsx("button",{onClick:l,disabled:!p,style:{...Ie,opacity:p?1:.5,cursor:p?"pointer":"not-allowed"},children:"🖨 নোটিশ ৩ তৈরি করুন — কমিটি মনোনয়ন ও তদন্ত সময়সীমা"}),!p&&r>0&&e.jsx("div",{style:{marginTop:6,fontSize:11.5,color:"#94a3b8",fontFamily:D},children:"সব কমিটি সদস্যের নাম ও নোটিশ ইস্যু তারিখ পূরণ করুন প্রথমে"})]})]})}const V="'Noto Sans Bengali', Arial, sans-serif",L={fontSize:13,fontWeight:600,fontFamily:V,color:"#1e293b",display:"block",marginBottom:6},G={width:"100%",padding:"9px 12px",border:"1px solid #cbd5e1",borderRadius:8,fontSize:13,fontFamily:V,background:"#fff",color:"#1e293b",outline:"none",boxSizing:"border-box"},Y={marginBottom:16},Pe={padding:"9px 16px",background:"#1e3a5f",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:V};function Le({data:t,setData:i,onGenerateOutput:s}){const l=(o,c)=>i({...t,[o]:c}),r=!!(t.investigationReportSummary&&t.recommendation&&t.evaluationDate);return e.jsxs("div",{style:{background:"#fff",borderRadius:10,border:"1px solid #e2e8f0",padding:20},children:[e.jsxs("div",{style:{...Y,maxWidth:280},children:[e.jsx("label",{style:L,children:"তারিখ *"}),e.jsx("input",{type:"date",value:t.evaluationDate,onChange:o=>l("evaluationDate",o.target.value),style:G}),t.evaluationDate&&e.jsxs("div",{style:{fontSize:11,color:"#64748b",marginTop:3},children:[u(t.evaluationDate)," ইং"]})]}),e.jsxs("div",{style:{...Y,paddingBottom:16,borderBottom:"1px solid #e2e8f0"},children:[e.jsx("label",{style:L,children:"সারাংশ: *"}),e.jsx("textarea",{value:t.investigationReportSummary,onChange:o=>l("investigationReportSummary",o.target.value),rows:5,placeholder:"গত ২ জুলাই ২০২৬ইং তারিখ ... তদন্ত কমিটির পর্যালোচনার ভিত্তিতে ...",style:{...G,resize:"vertical",lineHeight:1.7}})]}),e.jsxs("div",{style:Y,children:[e.jsx("label",{style:L,children:"সুপারিশ: *"}),e.jsx("textarea",{value:t.recommendation,onChange:o=>l("recommendation",o.target.value),rows:4,placeholder:"তদন্ত কমিটির সুপারিশ লিখুন...",style:{...G,resize:"vertical",lineHeight:1.7}})]}),e.jsx("button",{onClick:s,disabled:!r,style:{...Pe,opacity:r?1:.5,cursor:r?"pointer":"not-allowed"},children:"🖨 প্রতিবেদন ও সুপারিশ তৈরি করুন"})]})}const k="'Noto Sans Bengali', Arial, sans-serif",Ge={fontSize:13,fontWeight:600,fontFamily:k,color:"#1e293b",display:"block",marginBottom:6},Ye={width:"100%",padding:"9px 12px",border:"1px solid #cbd5e1",borderRadius:8,fontSize:13,fontFamily:k,background:"#fff",color:"#1e293b",outline:"none",boxSizing:"border-box"},He={marginBottom:16},Je={padding:"9px 16px",background:"#1e3a5f",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:k};function Ue({data:t,setData:i,festivalHolidays:s,onGenerateNotice4:l}){const r=(p,d)=>i({...t,[p]:d}),o=K(t.evaluationDate,s),c=!!(t.finalDecision&&t.evaluationDate);return e.jsxs("div",{style:{background:"#fff",borderRadius:10,border:"1px solid #e2e8f0",padding:20},children:[!t.evaluationDate&&e.jsx("div",{style:{marginBottom:16,padding:"10px 14px",background:"#fef3c7",border:"1px solid #fde68a",borderRadius:8,fontSize:12.5,fontFamily:k,color:"#92400e"},children:'প্রথমে "মূল্যায়ন" ধাপে তারিখ ও প্রতিবেদন পূরণ করুন — নোটিশ ৪-এর তারিখ সেই তারিখ থেকে স্বয়ংক্রিয়ভাবে গণনা হবে।'}),e.jsxs("div",{style:He,children:[e.jsx("label",{style:Ge,children:"চূড়ান্ত সিদ্ধান্ত: *"}),e.jsx("textarea",{value:t.finalDecision,onChange:p=>r("finalDecision",p.target.value),rows:5,placeholder:"কর্তৃপক্ষের চূড়ান্ত সিদ্ধান্ত লিখুন...",style:{...Ye,resize:"vertical",lineHeight:1.7}})]}),e.jsxs("div",{style:{marginBottom:20,fontSize:12.5,fontFamily:k,color:"#64748b"},children:["নোটিশ ৪ ইস্যু তারিখ (স্বয়ংক্রিয় — মূল্যায়নের তারিখের পরবর্তী কর্মদিবস):"," ",e.jsx("strong",{style:{color:"#1e293b"},children:o?`${u(o)} ইং`:"—"})]}),e.jsx("button",{onClick:l,disabled:!c,style:{...Je,opacity:c?1:.5,cursor:c?"pointer":"not-allowed"},children:"🖨 নোটিশ ৪ তৈরি করুন — চূড়ান্ত সিদ্ধান্ত অবহিতকরণ"}),!c&&e.jsx("div",{style:{marginTop:6,fontSize:11.5,color:"#94a3b8",fontFamily:k},children:'"চূড়ান্ত সিদ্ধান্ত" ও "মূল্যায়ন" ধাপের তারিখ পূরণ করুন প্রথমে'})]})}const Ke=["০","১","২","৩","৪","৫","৬","৭","৮","৯"],le=t=>t.replace(/[0-9]/g,i=>Ke[Number(i)]),Ve=t=>!t||!t.trim()?"___":t.trim().split(/\s+/).map(s=>s[0]).join(" ").toUpperCase()||"___",Xe={1:"SC",2:"IN",3:"IC",4:"FD",evaluation:"EV"},ae=(t,i,s)=>{const l=Ve(t.factoryName),r=Xe[String(i)],o=t.cardNo?le(String(t.cardNo)):"___";let c="__-__-____";if(s){const p=new Date(s);if(!isNaN(p.getTime())){const d=String(p.getDate()).padStart(2,"0"),m=String(p.getMonth()+1).padStart(2,"0"),n=String(p.getFullYear());c=le(`${d}-${m}-${n}`)}}return`${l}/${r}-${o}/${c}`},Ze=({data:t,notice:i,authorization:s,festivalHolidays:l})=>{const r=Number(t.numberOfCommitteeMembers)||0,o=pe(r),c=U(t.showCauseDate,50,l),p=t.subject==="অস্থায়ী স্থগিতাদেশ সহ কারণ দর্শানোর নোটিশ।",d=K(t.evaluationDate,l),m=["শ্রমিকের ব্যক্তিগত নথি।","সংশ্লিষ্ট ব্যক্তি।"],n=i===1?t.showCauseDate:i===2?t.notice2Date:i===3?t.notice3Date:i===4?d:t.evaluationDate,f=t.referenceNo||ae(t,i,n);return e.jsxs("div",{className:"nl-page",children:[e.jsxs("div",{className:"nl-wrap",children:[e.jsxs("div",{className:"nl-header",children:[t.factoryName&&e.jsx("h1",{className:"nl-co-name",children:t.factoryName}),t.factoryAddress&&e.jsx("p",{className:"nl-co-addr",children:t.factoryAddress})]}),e.jsxs("div",{className:"nl-title-bar",children:[e.jsxs("h2",{className:"nl-title",children:["সূত্রঃ ",f]}),e.jsx("div",{className:"nl-meta",children:e.jsxs("span",{className:"nl-meta-date",children:["তারিখ : ",e.jsxs("strong",{children:[u(n)," ইং"]})]})})]}),(i===1||i===2||i===4)&&e.jsx("div",{className:"nl-emp-box",children:e.jsx("div",{className:"nl-emp-col",children:e.jsx("table",{className:"nl-emp-tbl",children:e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:"নাম"}),e.jsx("td",{children:t.employeeName||"—"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"পদবী"}),e.jsx("td",{children:t.designation||"—"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"কার্ড নং"}),e.jsx("td",{children:t.cardNo||"—"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"সেকশন"}),e.jsx("td",{children:t.section||"—"})]})]})})})}),i===3&&e.jsxs("div",{className:"nl-salute",children:[e.jsx("p",{style:{margin:0},children:"প্রতি,"}),e.jsx("p",{style:{margin:0},children:"তদন্ত কমিটির সদস্যবৃন্দ।"})]}),i==="evaluation"&&e.jsxs("div",{className:"nl-salute",children:[e.jsx("p",{style:{margin:0},children:"প্রতি,"}),e.jsx("p",{style:{margin:0},children:"ব্যবস্থাপনা কর্তৃপক্ষ।"})]}),e.jsxs("p",{className:"nl-subject",children:["বিষয়ঃ ",i===1&&e.jsx("u",{children:e.jsx("strong",{children:t.subject})}),i===2&&e.jsx("u",{children:e.jsx("strong",{children:"তদন্ত কমিটিতে প্রতিনিধি মনোনয়ন প্রসঙ্গে।"})}),i===3&&e.jsx("u",{children:e.jsx("strong",{children:"তদন্ত কমিটিতে সদস্য মনোনীতকরণ প্রসঙ্গে।।"})}),i===4&&e.jsx("u",{children:e.jsx("strong",{children:"শৃঙ্খলামূলক ব্যবস্থা গ্রহণ সংক্রান্ত চূড়ান্ত সিদ্ধান্ত অবহিতকরণ।"})}),i==="evaluation"&&e.jsxs("u",{children:["অভিযোগ সূত্রঃ ",e.jsx("u",{style:{whiteSpace:"nowrap"},children:ae(t,1,t.showCauseDate)}),"-এর ",e.jsx("strong",{children:"তদন্ত প্রতিবেদন দাখিল প্রসঙ্গে।"})]})]}),e.jsx("p",{className:"nl-salute",children:"জনাব/জনাবা,"}),e.jsxs("div",{className:"nl-body",children:[i===1&&e.jsxs(e.Fragment,{children:[e.jsxs("p",{className:"nl-para",children:["আপনার বিরুদ্ধে অভিযোগ যে, ",t.complaint||"_____"]}),e.jsx("p",{className:"nl-para",children:"আপনার এহেন কর্মকান্ড কোম্পানী নিয়মের সম্পূর্ণ পরিপন্থি ও বাংলাদেশ শ্রম আইন ২০০৬ মোতাবেক অসদাচরণের আওতায় পড়ে।"}),e.jsx("p",{className:"nl-para",children:"সুতরাং উপরোক্ত কর্মকান্ডের প্রেক্ষিতে আপনার বিরুদ্ধে কেন আইনানুগ ব্যবস্থা গ্রহণ করা হবে না তাহার লিখিত জবাব আগামী ০৭ কর্মদিবসের মধ্যে নিম্ন স্বাক্ষরকারীগণের নিকট প্রদান করার জন্য নির্দেশ প্রদান করা হইল।"}),p&&e.jsx(e.Fragment,{children:e.jsx("p",{className:"nl-para",children:"উল্লেখ্য যে পরবর্তী নির্দেশনা না দেওয়া পর্যন্ত আপনি অস্থায়ীভাবে কর্ম থেকে ছুটিত থাকবেন।"})})]}),i===2&&e.jsxs(e.Fragment,{children:[e.jsxs("p",{className:"nl-para",children:["আপনার বিরুদ্ধে গত ",e.jsx("u",{children:e.jsx("strong",{children:u(t.showCauseDate)})})," ইং তারিখে উত্থাপিত অভিযোগের ভিত্তিতে আপনার"," ",e.jsx("u",{children:e.jsx("strong",{children:u(t.replyDate)})})," ইং তারিখের জবাব কর্তৃপক্ষের নিকট সন্তোষজনক হয়নি বিধায় উক্ত অভিযোগটির সঠিক তদন্ত কার্যক্রম পরিচালনার সিদ্ধান্ত গ্রহণ করা হয়েছে।"]}),e.jsxs("p",{className:"nl-para",children:["এই মর্মে আপনাকে আগামী ৪ দিনের মধ্যে আপনার মনোনীত ",e.jsx("u",{children:e.jsx("strong",{children:z(o)})})," জন প্রতিনিধির তালিকা নিম্ন স্বাক্ষরকারী কর্তৃপক্ষের নিকট প্রদান করার জন্য বলা হয়েছে।"]}),e.jsx("p",{className:"nl-para",children:"উল্লেখ্য যে যথা সময়ে প্রতিনিধি মনোনয়নে ব্যর্থ হলে তদন্তকার্যক্রমটি একতরফাভাবে পরিচালিত হবে।"})]}),i===3&&e.jsxs(e.Fragment,{children:[e.jsxs("p",{className:"nl-para",children:["আপনাদেরকে এই মর্মে অবগত করা হচ্ছে যে, গত ",e.jsx("u",{children:e.jsx("strong",{children:u(t.showCauseDate)})})," ইং তারিখে জনাব/জনাবা ",e.jsx("u",{children:e.jsx("strong",{children:t.employeeName||"—"})})," (কার্ড নং: ",t.cardNo||"—",", ",t.designation||"—",","," ",t.section||"—",")-এর বিরুদ্ধে উত্থাপিত অভিযোগের ভিত্তিতে তদন্ত পরিচালনা কমিটিতে মনোনয়ন প্রদান করা হয়েছে।"]}),e.jsxs("p",{className:"nl-para",children:["সুতরাং আপনারা আগামী ",e.jsx("u",{children:e.jsx("strong",{children:u(c)})})," ইং তারিখের মধ্যে তদন্ত কার্যক্রমটি সংক্ষুক্তভাবে নিরপেক্ষতার ভিত্তিতে কোন প্রকার স্বার্থের সংঘর্ষ (Conflict of interest) ব্যতিত সম্পন্ন করার জন্য নির্দেশ প্রদান করা হয়েছে।"]}),e.jsx("p",{className:"nl-para",style:{fontWeight:700,textDecoration:"underline",marginTop:14},children:"কমিটির তালিকাঃ"}),e.jsxs("table",{className:"nl-committee-tbl",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{style:{width:"15%"},children:"ক্রমিক"}),e.jsx("th",{style:{width:"25%"},children:"নাম"}),e.jsx("th",{style:{width:"20%"},children:"কার্ড নং"}),e.jsx("th",{style:{width:"20%"},children:"পদবী"}),e.jsx("th",{style:{width:"20%"},children:"সেকশন"})]})}),e.jsx("tbody",{children:t.committeeMembers.map((x,j)=>e.jsxs("tr",{children:[e.jsx("td",{style:{textAlign:"center"},children:z(x.slNo)}),e.jsx("td",{children:x.name||"—"}),e.jsx("td",{style:{textAlign:"center"},children:x.cardNo||"—"}),e.jsx("td",{children:x.designation||"—"}),e.jsx("td",{children:x.section||"—"})]},j))})]})]}),i===4&&e.jsxs(e.Fragment,{children:[e.jsx("p",{className:"nl-para",children:"আপনার বিরুদ্ধে উত্থাপিত অভিযোগের ভিত্তিতে গঠিত তদন্ত কমিটির প্রতিবেদন ও সুপারিশ পর্যালোচনা করে কর্তৃপক্ষ নিম্নোক্ত চূড়ান্ত সিদ্ধান্ত গ্রহণ করেছে।"}),e.jsx("p",{className:"nl-para",children:t.finalDecision||"_____"}),e.jsx("p",{className:"nl-para",children:"উক্ত সিদ্ধান্ত অত্র পত্র প্রাপ্তির তারিখ থেকে কার্যকর হবে এবং এই মর্মে আপনাকে অবহিত করা হলো।"})]}),i==="evaluation"&&e.jsxs(e.Fragment,{children:[e.jsxs("p",{className:"nl-para",children:["গত ",e.jsx("u",{children:u(t.notice3Date)})," ইং তারিখে জারিকৃত নোটিশের পরিপ্রেক্ষিতে আমরা নিম্নস্বাক্ষরকারীগণ অভিযুক্ত ব্যক্তি জনাব/জনাবা ",e.jsxs("u",{children:[t.employeeName,"-",t.cardNo]})," এর বিরুদ্ধে গঠিত তদন্ত কমিটির সদস্য হিসেবে নিযুক্ত হই। পরবর্তীতে, বিলম্ব না করে সদস্য নিযুক্ত হওয়ার দিন থেকেই তদন্ত কার্যক্রম শুরু করে আজ ",e.jsx("u",{children:u(t.evaluationDate)})," ইং তারিখ কার্যক্রম সম্পন্ন করি। অভিযুক্ত ব্যক্তির সংশ্লিষ্ট সকল তথ্য-উপাত্ত, মৌখিক ও লিখিত সাক্ষ্য এবং অন্যান্য প্রাসঙ্গিক প্রমাণাদি পর্যালোচনা ও যাচাইপূর্বক নিম্নলিখিত তদন্ত প্রতিবেদন পেশ করা হলো।"]}),e.jsxs("div",{className:"nl-eval-section",children:[e.jsx("p",{className:"nl-eval-label",children:"বিস্তারিত প্রতিবেদন:"}),e.jsx("p",{className:"nl-eval-text",children:t.investigationReportSummary||"—"}),e.jsx("hr",{className:"nl-eval-divider"})]}),e.jsxs("div",{className:"nl-eval-section",children:[e.jsx("p",{className:"nl-eval-label",children:"সুপারিশ:"}),e.jsx("p",{className:"nl-eval-text",children:t.recommendation||"—"}),e.jsx("hr",{className:"nl-eval-divider"})]})]})]}),(i===1||i===2||i===4)&&e.jsxs("div",{className:"nl-copy",children:[e.jsx("p",{children:e.jsx("strong",{children:e.jsx("u",{children:"অনুলিপি :"})})}),e.jsx("ol",{children:m.map((x,j)=>e.jsxs("li",{children:[e.jsxs("span",{children:[z(j+1),"."]}),x]},j))})]}),e.jsx("div",{className:"nl-footer",children:i==="evaluation"?e.jsx(e.Fragment,{children:t.committeeMembers.length>0&&e.jsx("div",{className:"nl-committee-sig-row",children:t.committeeMembers.map((x,j)=>e.jsxs("div",{className:"nl-committee-sig-col",children:[e.jsx("div",{className:"nl-committee-sig-name",children:x.name||"—"}),e.jsxs("div",{className:"nl-committee-sig-desig",children:[x.designation||"—",x.section?` (${x.section})`:""]})]},j))})}):e.jsxs(e.Fragment,{children:[e.jsx("p",{className:"nl-authority",children:"নির্দেশক্রমে,"}),e.jsx(je,{value:s,lang:"bn",hidePrepared:!0,hideTopBorder:!0})]})})]}),e.jsx("style",{children:`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap');

        .nl-page, .nl-page * { font-family: 'Noto Sans Bengali', 'Noto Sans', Arial, sans-serif; box-sizing: border-box; }

        .nl-page {
          width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff;
          box-shadow: 0 4px 24px rgba(0,0,0,0.12); border-radius: 6px; padding: 18mm 16mm;
        }
        .nl-wrap { display: flex; flex-direction: column; min-height: calc(297mm - 36mm); gap: 0; }

        .nl-header { text-align: center; border-bottom: 2.5px solid #1d4ed8; padding-bottom: 10px; margin-bottom: 10px; }
        .nl-co-name { font-size: 20px; font-weight: 700; color: #1e3a5f; letter-spacing: 0.5px; margin: 0 0 3px; text-transform: uppercase; }
        .nl-co-addr { font-size: 13px; color: #374151; margin: 0; }

        .nl-title-bar { display: flex; align-items: center; justify-content: space-between; padding: 8px 0 6px; border-bottom: 1px dashed #d1d5db; margin-bottom: 8px; flex-wrap: wrap; gap: 4px; }
        .nl-title { font-size: 13px; font-weight: 600; margin: 0; color: #111827; }
        .nl-meta { display: flex; flex-direction: column; align-items: flex-end; font-size: 13px; gap: 2px; }
        .nl-meta-date { color: #374151; }

        .nl-salute { font-size: 14px; font-weight: 600; margin: 8px 0 10px; }

        .nl-emp-box { display: flex; gap: 0; border: 1.5px solid #374151; border-radius: 5px; overflow: hidden; margin-bottom: 14px; max-width: 320px; }
        .nl-emp-col { flex: 1; padding: 10px 12px; }
        .nl-emp-tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
        .nl-emp-tbl td { padding: 2px 4px 2px 0; vertical-align: top; line-height: 1.5; }
        .nl-emp-tbl td:first-child { font-weight: 600; white-space: nowrap; padding-right: 6px; width: 38%; }
        .nl-emp-tbl td:first-child::after { content: ':'; }

        .nl-subject { font-weight: 700; font-size: 13.5px; line-height: 1.7; margin: 0 0 6px; }

        /* কমিটির তালিকাঃ (Notice 3 committee list) — bordered, striped,
           professional table distinct from the plain nl-emp-tbl used for
           the employee-info box. */
        .nl-committee-tbl {
          width: 100%; border-collapse: collapse; table-layout: fixed;
          margin: 8px 0 14px; font-size: 12.5px;
          border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden;
        }
        .nl-committee-tbl thead tr { background: #1e3a5f; }
        .nl-committee-tbl th {
          padding: 8px 10px; font-weight: 700; font-size: 12px; color: #fff;
          text-align: left; letter-spacing: 0.2px; border-right: 1px solid rgba(255,255,255,0.15);
        }
        .nl-committee-tbl th:last-child { border-right: none; }
        .nl-committee-tbl td {
          padding: 7px 10px; border-right: 1px solid #e2e8f0; border-top: 1px solid #e2e8f0;
          vertical-align: middle; color: #1f2937;
        }
        .nl-committee-tbl td:last-child { border-right: none; }
        .nl-committee-tbl tbody tr:nth-child(even) { background: #f8fafc; }
        .nl-committee-tbl tbody tr:hover { background: #eff6ff; }

        .nl-body { flex: 1; display: flex; flex-direction: column; justify-content: flex-start; gap: 0; margin-bottom: 14px; }
        .nl-para { font-size: 13.5px; line-height: 1.85; text-align: justify; margin: 0 0 12px; }

        /* Evaluation output (প্রতিবেদন ও সুপারিশ) — label + paragraph,
           each section closed off with a dashed divider, matching the
           reference layout instead of table rows. */
        .nl-eval-section { margin-bottom: 10px; }
        .nl-eval-label { font-size: 13.5px; font-weight: 700; margin: 0 0 4px; color: #111827; }
        .nl-eval-text { font-size: 13.5px; line-height: 1.85; text-align: justify; margin: 0 0 8px; }
        .nl-eval-divider { border: none; border-top: 1px dashed #9ca3af; margin: 0; }

        .nl-copy { font-size: 13px; margin-bottom: 12px; }
        .nl-copy p { margin: 0 0 4px; }
        .nl-copy ol { list-style: none; padding: 0; margin: 0; }
        .nl-copy li { display: flex; gap: 6px; margin-bottom: 2px; }
        .nl-copy li span { font-weight: 600; flex-shrink: 0; }

        .nl-footer { margin-top: auto; padding-top: 8px; }
        .nl-authority { font-size: 13.5px; font-weight: 700; margin: 0 0 4px; }

        /* Investigation-committee signature row (evaluation output only) —
           each member gets a bordered column with name (bold) + role,
           matching the reference layout's multi-column authority block. */
        .nl-committee-sig-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 16px;
          margin-top: 34px;
        }
        .nl-committee-sig-col {
          border-top: 1.5px solid #1e3a5f;
          padding-top: 6px;
          text-align: center;
        }
        .nl-committee-sig-name { font-size: 12.5px; font-weight: 700; color: #1e3a5f; margin-bottom: 2px; }
        .nl-committee-sig-desig { font-size: 11px; color: #374151; line-height: 1.4; }

        ${J}

        @media print {
          @page { size: A4 portrait; margin: 14mm 15mm 14mm 15mm; }
          body * { visibility: hidden !important; }
          .nl-page, .nl-page * { visibility: visible !important; }
          .nl-page {
            position: absolute !important; inset: 0 !important; width: 100% !important;
            min-height: unset !important; padding: 0 !important; margin: 0 !important;
            box-shadow: none !important; border-radius: 0 !important; background: white !important;
          }
          .nl-wrap { min-height: calc(297mm - 28mm) !important; height: calc(297mm - 28mm) !important; page-break-inside: avoid !important; }
          .nl-body { flex: 1 !important; justify-content: flex-start !important; margin-bottom: 10pt !important; }
          .nl-para { font-size: 10pt !important; line-height: 1.75 !important; }
          .nl-eval-label, .nl-eval-text { font-size: 10pt !important; line-height: 1.75 !important; }
          .nl-committee-sig-name { font-size: 10pt !important; }
          .nl-committee-sig-desig { font-size: 8.5pt !important; }
          .nl-committee-tbl { font-size: 9.5pt !important; }
          .nl-committee-tbl thead tr, .nl-committee-tbl th {
            -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
            background: #1e3a5f !important; color: #fff !important;
          }
          .nl-footer { page-break-inside: avoid !important; }
        }
      `})]})},qe="'Noto Sans Bengali', 'Noto Sans', Arial, sans-serif",Qe=({data:t,festivalHolidays:i})=>{const s=K(t.evaluationDate,i),l=t.replyStatus==="সন্তোষজনক",r=[{step:1,stage:"ধাপ ১",title:"কারণ দর্শানো",description:"কারণ দর্শানোর নোটিশ জারি করা হয়।",date:t.showCauseDate,output:"নোটিশ ১"},{step:2,stage:"ধাপ ২",title:"জবাব ও অবস্থা",description:t.replyStatus?`কর্মীর জবাব "${t.replyStatus}" হিসেবে চিহ্নিত হয়েছে।`:"কর্মীর জবাব যাচাই করা হয়।",date:t.replyDate,output:t.replyStatus||"—"},{step:3,stage:"ধাপ ৩",title:"প্রতিনিধি মনোনয়ন",description:"কমিটি সদস্য সংখ্যা ও শ্রমিক প্রতিনিধি মনোনয়নের নির্দেশনা।",date:t.notice2Date,output:"নোটিশ ২"},{step:4,stage:"ধাপ ৪",title:"তদন্ত কমিটি",description:"তদন্ত কমিটি গঠন ও তদন্ত সময়সীমা নির্ধারণ।",date:t.notice3Date,output:"নোটিশ ৩"},{step:5,stage:"ধাপ ৫",title:"মূল্যায়ন",description:"তদন্ত প্রতিবেদনের সারাংশ ও সুপারিশ লিপিবদ্ধ।",date:t.evaluationDate,output:"প্রতিবেদন ও সুপারিশ"},{step:6,stage:"ধাপ ৬",title:"চূড়ান্ত সিদ্ধান্ত",description:"কর্তৃপক্ষের চূড়ান্ত সিদ্ধান্ত অবহিতকরণ।",date:s,output:"নোটিশ ৪"}];return e.jsxs("div",{className:"pf-page",children:[e.jsxs("div",{className:"pf-wrap",children:[e.jsxs("div",{className:"pf-header",children:[t.factoryName&&e.jsx("h1",{className:"pf-co-name",children:t.factoryName}),t.factoryAddress&&e.jsx("p",{className:"pf-co-addr",children:t.factoryAddress})]}),e.jsxs("div",{className:"pf-title-bar",children:[e.jsx("h2",{className:"pf-title",children:"শৃঙ্খলামূলক ব্যবস্থা — কার্যধারার সারসংক্ষেপ"}),e.jsx("div",{className:"pf-meta",children:t.referenceNo&&e.jsxs("span",{children:["সূত্রঃ ",e.jsx("strong",{children:t.referenceNo})]})})]}),e.jsxs("div",{className:"pf-emp-box",children:[e.jsx("div",{className:"pf-emp-box-head",children:"কর্মীর তথ্য"}),e.jsx("div",{className:"pf-emp-col",children:e.jsx("table",{className:"pf-emp-tbl",children:e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:"নাম"}),e.jsx("td",{children:t.employeeName||"—"}),e.jsx("td",{children:"কার্ড নং"}),e.jsx("td",{children:t.cardNo||"—"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"পদবী"}),e.jsx("td",{children:t.designation||"—"}),e.jsx("td",{children:"সেকশন"}),e.jsx("td",{children:t.section||"—"})]})]})})})]}),e.jsxs("table",{className:"pf-tbl",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{style:{width:"8%"},children:"ধাপ"}),e.jsx("th",{style:{width:"38%"},children:"বিবরণ"}),e.jsx("th",{style:{width:"18%"},children:"তারিখ"}),e.jsx("th",{style:{width:"18%"},children:"ফলাফল"}),e.jsx("th",{style:{width:"18%"},children:"অবস্থা"})]})}),e.jsx("tbody",{children:r.map(o=>{const c=l&&o.step>2,p=!!o.date;return e.jsxs("tr",{className:c?"pf-row-muted":"",children:[e.jsx("td",{className:"pf-cell-step",children:e.jsx("span",{className:"pf-step-badge",children:o.step})}),e.jsxs("td",{children:[e.jsx("div",{className:"pf-cell-title",children:o.title}),e.jsx("div",{className:"pf-cell-desc",children:o.description})]}),e.jsx("td",{className:"pf-cell-date",children:c?"—":p?`${u(o.date)} ইং`:"—"}),e.jsx("td",{className:"pf-cell-output",children:c||o.output==="—"?"—":o.output}),e.jsx("td",{children:c?e.jsx("span",{className:"pf-status pf-status-na",children:"প্রযোজ্য নয়"}):o.step===2&&t.replyStatus==="সন্তোষজনক"?e.jsx("span",{className:"pf-status pf-status-done",children:"সমাপ্ত"}):o.step===2&&t.replyStatus==="অসন্তোষজনক"?e.jsx("span",{className:"pf-status pf-status-progress",children:"চলমান"}):p?e.jsx("span",{className:"pf-status pf-status-done",children:"সম্পন্ন"}):e.jsx("span",{className:"pf-status pf-status-pending",children:"অসম্পন্ন"})})]},o.step)})})]}),l&&e.jsx("div",{className:"pf-note",children:"✓ কর্মীর জবাব সন্তোষজনক বিবেচিত হওয়ায় ধাপ ২-এ কেসটি সমাপ্ত হয়েছে — পরবর্তী ধাপগুলো প্রযোজ্য হয়নি।"})]}),e.jsx("style",{children:`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap');

        .pf-page, .pf-page * { font-family: ${qe}; box-sizing: border-box; }

        .pf-page {
          width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff;
          box-shadow: 0 4px 24px rgba(0,0,0,0.12); border-radius: 6px; padding: 16mm 16mm 14mm;
        }
        .pf-wrap { display: flex; flex-direction: column; }

        .pf-header { text-align: center; border-bottom: 2.5px solid #1d4ed8; padding-bottom: 8px; margin-bottom: 12px; }
        .pf-co-name { font-size: 19px; font-weight: 700; color: #1e3a5f; letter-spacing: 0.5px; margin: 0 0 3px; text-transform: uppercase; }
        .pf-co-addr { font-size: 12.5px; color: #374151; margin: 0; }

        .pf-title-bar { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #d1d5db; margin-bottom: 14px; flex-wrap: wrap; gap: 6px; }
        .pf-title { font-size: 15px; font-weight: 700; margin: 0; color: #1e3a5f; }
        .pf-meta { font-size: 12.5px; color: #374151; }

        .pf-emp-box { border: 1.5px solid #1e3a5f; border-radius: 6px; overflow: hidden; margin-bottom: 18px; max-width: 460px; }
        .pf-emp-box-head { background: #1e3a5f; color: #fff; font-size: 11.5px; font-weight: 700; letter-spacing: 0.3px; padding: 5px 12px; }
        .pf-emp-col { padding: 8px 12px; }
        .pf-emp-tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
        .pf-emp-tbl td { padding: 3px 6px; vertical-align: top; line-height: 1.5; }
        .pf-emp-tbl td:nth-child(1), .pf-emp-tbl td:nth-child(3) { font-weight: 600; color: #475569; white-space: nowrap; width: 15%; }
        .pf-emp-tbl td:nth-child(1)::after, .pf-emp-tbl td:nth-child(3)::after { content: ':'; margin-right: 2px; }
        .pf-emp-tbl td:nth-child(2), .pf-emp-tbl td:nth-child(4) { width: 35%; }

        .pf-tbl {
          width: 100%; border-collapse: collapse; table-layout: fixed;
          font-size: 12px; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden;
        }
        .pf-tbl thead tr { background: #1e3a5f; }
        .pf-tbl th {
          padding: 9px 10px; font-weight: 700; font-size: 11.5px; color: #fff;
          text-align: left; letter-spacing: 0.2px; border-right: 1px solid rgba(255,255,255,0.15);
        }
        .pf-tbl th:last-child { border-right: none; }
        .pf-tbl td {
          padding: 9px 10px; border-right: 1px solid #e2e8f0; border-top: 1px solid #e2e8f0;
          vertical-align: top; color: #1f2937;
        }
        .pf-tbl td:last-child { border-right: none; }
        .pf-tbl tbody tr:nth-child(even) { background: #f8fafc; }
        .pf-tbl tbody tr.pf-row-muted { color: #94a3b8; background: #f8fafc; }
        .pf-tbl tbody tr.pf-row-muted td { color: #94a3b8; }

        .pf-cell-step { text-align: center; }
        .pf-step-badge {
          display: inline-flex; align-items: center; justify-content: center;
          width: 24px; height: 24px; border-radius: 50%; background: #1e3a5f; color: #fff;
          font-weight: 700; font-size: 12px;
        }
        .pf-row-muted .pf-step-badge { background: #cbd5e1; }

        .pf-cell-title { font-weight: 700; font-size: 12.5px; color: #111827; margin-bottom: 2px; }
        .pf-row-muted .pf-cell-title { color: #94a3b8; }
        .pf-cell-desc { font-size: 11px; line-height: 1.5; color: #64748b; }
        .pf-cell-date { font-weight: 600; white-space: nowrap; }
        .pf-cell-output { font-weight: 600; }

        .pf-status {
          display: inline-block; font-size: 10.5px; font-weight: 700; border-radius: 999px;
          padding: 2px 9px; white-space: nowrap;
        }
        .pf-status-done     { color: #15803d; background: #f0fdf4; border: 1px solid #86efac; }
        .pf-status-progress { color: #c2410c; background: #fff7ed; border: 1px solid #fdba74; }
        .pf-status-pending  { color: #64748b; background: #f1f5f9; border: 1px solid #e2e8f0; }
        .pf-status-na       { color: #94a3b8; background: #f8fafc; border: 1px dashed #e2e8f0; }

        .pf-note {
          margin-top: 14px; padding: 10px 14px; background: #f0fdf4; border: 1px solid #86efac;
          border-radius: 8px; font-size: 12px; color: #15803d; font-weight: 600; line-height: 1.6;
        }

        .pf-footer { margin-top: 24px; text-align: right; font-size: 11px; color: #94a3b8; }

        ${J}

        @media print {
          @page { size: A4 portrait; margin: 14mm 15mm 14mm 15mm; }
          body * { visibility: hidden !important; }
          .pf-page, .pf-page * { visibility: visible !important; }
          .pf-page {
            position: absolute !important; inset: 0 !important; width: 100% !important;
            min-height: unset !important; padding: 0 !important; margin: 0 !important;
            box-shadow: none !important; border-radius: 0 !important; background: white !important;
          }
          .pf-tbl { font-size: 9.5pt !important; }
          .pf-tbl thead tr, .pf-tbl th {
            -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
            background: #1e3a5f !important; color: #fff !important;
          }
          .pf-status-done, .pf-status-progress, .pf-status-pending, .pf-status-na {
            -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
          }
          .pf-tbl { page-break-inside: avoid !important; }
        }
      `})]})},et=[{id:"showCause",label:"কারণ দর্শানো",icon:"ti-alert-triangle"},{id:"reply",label:"জবাব ও অবস্থা",icon:"ti-message-circle"},{id:"nomination",label:"প্রতিনিধি মনোনয়ন",icon:"ti-users-group"},{id:"committee",label:"তদন্ত কমিটি",icon:"ti-users"},{id:"evaluation",label:"মূল্যায়ন",icon:"ti-file-report"},{id:"finalDecision",label:"চূড়ান্ত সিদ্ধান্ত",icon:"ti-gavel"}];function de(t,i){return{...i,referenceNo:String(t.referenceNo??""),employeeName:String(t.employeeName??""),cardNo:String(t.cardNo??""),designation:String(t.designation??""),section:String(t.section??""),joiningDate:C(t.joiningDate)||"",showCauseDate:C(t.showCauseDate)||"",subject:ce.includes(t.subject)?t.subject:"কারণ দর্শানোর নোটিশ।",complaint:String(t.complaint??""),replyDate:C(t.replyDate)||"",replyStatus:t.replyStatus==="সন্তোষজনক"||t.replyStatus==="অসন্তোষজনক"?t.replyStatus:"",numberOfCommitteeMembers:String(t.numberOfCommitteeMembers??""),notice2Date:C(t.notice2Date)||"",committeeMembers:(()=>{try{const s=JSON.parse(String(t.committeeMembersJson??"[]"));return Array.isArray(s)?s.map((l,r)=>({slNo:Number(l.slNo??r+1),name:String(l.name??""),cardNo:String(l.cardNo??""),designation:String(l.designation??""),section:String(l.section??"")})):i.committeeMembers}catch{return i.committeeMembers}})(),notice3Date:C(t.notice3Date)||"",investigationReportSummary:String(t.investigationReportSummary??""),recommendation:String(t.recommendation??""),finalDecision:String(t.finalDecision??""),evaluationDate:C(t.evaluationDate)||"",date:C(t.date)||i.date}}function dt(){const t=ue(),{user:i}=ge(),s=ye("disciplinaryactions",t.id,i?.name??"unknown",1500),l=g.useRef(null),[r,o]=g.useState(ve),[c,p]=g.useState("showCause"),[d,m]=g.useState(!1),[n,f]=g.useState(H()),[x,j]=g.useState(1),[I,A]=g.useState(!1),M=t.festivalHolidays??[];g.useEffect(()=>{f(a=>({...a,factoryName:t.nameBn,factoryAddress:t.addressBn}))},[t.id]),g.useEffect(()=>{if(s.editingId||n.referenceNo||!n.employeeName||!n.complaint)return;const a=String(new Date().getFullYear()),h=s.records.filter(v=>String(v.date??"").startsWith(a.slice(0,4))).length,y=t.referenceCode||"";f(v=>({...v,referenceNo:Re(y,h,z(a))}))},[n.employeeName,n.complaint,s.editingId]),g.useEffect(()=>{if(!I)return;const a=h=>{h.key==="Escape"&&A(!1)};return window.addEventListener("keydown",a),()=>window.removeEventListener("keydown",a)},[I]);const O=()=>{f(a=>({...H(),factoryName:a.factoryName,factoryAddress:a.factoryAddress})),p("showCause"),m(!1),s.setEditingId(null)},X=a=>{const h=(a?document.getElementById(a):null)??l.current??document.getElementById("printable-area");if(!h){window.print();return}const y=document.createElement("iframe");y.style.cssText="position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;border:none;",document.body.appendChild(y);const v=y.contentDocument,he=Array.from(document.styleSheets).map(T=>{try{return Array.from(T.cssRules).map(R=>R.cssText).join(`
`)}catch{return""}}).join(`
`);v.open(),v.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
      <style>@page{size:A4 portrait;margin:12mm;}body{margin:0;}${he}</style>
      <style>html,body{background:#fff !important;color:#000 !important;}</style>
      </head><body>${h.outerHTML}</body></html>`),v.close(),y.onload=()=>{const T=v.fonts,R=()=>{y.contentWindow.focus(),y.contentWindow.print(),y.contentWindow.addEventListener("afterprint",()=>{document.body.removeChild(y)})};T?.ready?T.ready.then(()=>setTimeout(R,150)).catch(()=>setTimeout(R,200)):setTimeout(R,300)}},me=async()=>{const a=l.current??document.getElementById("printable-area");a&&await be({element:a,filename:`শৃঙ্খলামূলক_ব্যবস্থা_${x}_${n.employeeName.replace(/[^a-z0-9]/gi,"_")||"রেকর্ড"}`,scale:2})},fe=()=>({referenceNo:n.referenceNo,employeeName:n.employeeName,cardNo:n.cardNo,designation:n.designation,section:n.section,joiningDate:n.joiningDate,showCauseDate:n.showCauseDate,subject:n.subject,complaint:n.complaint,replyDate:n.replyDate,replyStatus:n.replyStatus,numberOfCommitteeMembers:n.numberOfCommitteeMembers,notice2Date:n.notice2Date,committeeMembersJson:JSON.stringify(n.committeeMembers),notice3Date:n.notice3Date,investigationReportSummary:n.investigationReportSummary,recommendation:n.recommendation,finalDecision:n.finalDecision,evaluationDate:n.evaluationDate,date:n.date,preparedBy:r.preparedBy,preparedByDesignation:r.preparedByDesignation}),b=a=>{j(a),m(!0)},P=Number(n.numberOfCommitteeMembers)||0,Z=!!(n.employeeName&&n.cardNo&&n.complaint&&n.showCauseDate),q=P>0&&!!n.notice2Date,Q=n.committeeMembers.length===P&&P>0&&n.committeeMembers.every(a=>a.name.trim()!=="")&&!!n.notice3Date,ee=!!(n.investigationReportSummary&&n.recommendation&&n.evaluationDate),te=!!(n.finalDecision&&n.evaluationDate),xe=g.useMemo(()=>{const a=[];return Z&&a.push({label:"নোটিশ ১",onClick:()=>b(1)}),q&&a.push({label:"নোটিশ ২",onClick:()=>b(2)}),Q&&a.push({label:"নোটিশ ৩",onClick:()=>b(3)}),ee&&a.push({label:"প্রতিবেদন ও সুপারিশ",onClick:()=>b("evaluation")}),te&&a.push({label:"নোটিশ ৪",onClick:()=>b(4)}),a.push({label:"প্রক্রিয়া দেখুন",onClick:()=>A(!0)}),a},[Z,q,Q,ee,te]);return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`
        ${J}
        ${Se}

        .da-flow-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 14px; background: #fff; color: #1e3a5f;
          border: 1.5px solid #1e3a5f; border-radius: 8px;
          font-size: 12.5px; font-weight: 600; cursor: pointer;
          font-family: 'Noto Sans Bengali', 'Noto Sans', Arial, sans-serif;
        }
        .da-flow-btn:hover { background: #eff6ff; }

        .da-flow-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(15, 23, 42, 0.55);
          display: flex; align-items: flex-start; justify-content: center;
          overflow-y: auto; padding: 32px 16px;
        }
        .da-flow-panel {
          position: relative; width: 100%; max-width: 850px;
        }
        .da-flow-toolbar { display: flex; justify-content: flex-end; margin-bottom: 10px; }
        .da-flow-close {
          position: fixed; top: 20px; right: 24px; z-index: 1001;
          width: 34px; height: 34px; border-radius: 50%;
          border: 1px solid #e2e8f0; background: #fff; color: #475569;
          font-size: 16px; font-weight: 700; cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          display: flex; align-items: center; justify-content: center;
        }
        .da-flow-close:hover { background: #f1f5f9; }
      `}),e.jsxs(we,{moduleName:"শৃঙ্খলামূলক ব্যবস্থা",moduleNameEn:"Disciplinary Action",date:n.date,onDateChange:a=>f(h=>({...h,date:a})),steps:et,activeStep:d?"":c,onStepChange:a=>{m(!1),p(a)},billItems:xe,isBillActive:d,onSave:async()=>{const a=fe(),h=s.editingId?await s.update(s.editingId,a):await s.save(a);return h&&O(),h},isSaving:s.isSaving,configured:s.configured,adapterName:s.adapterName,saveDisabled:!n.employeeName||!n.cardNo,editingId:s.editingId,onCancelEdit:O,onReset:O,onUpdate:a=>{s.setEditingId(String(a.id??"")),f(h=>de(a,h)),p("showCause"),m(!1)},updateModule:"disciplinaryactions",updateLabel:"শৃঙ্খলামূলক ব্যবস্থা খুঁজুন",updateSearchPlaceholder:"কর্মীর নাম বা আইডি দিয়ে খুঁজুন...",calcRows:[{label:"কর্মী",value:n.employeeName||"—"},{label:"জবাবের অবস্থা",value:n.replyStatus||"—"},{label:"কমিটি সদস্য",value:n.replyStatus==="অসন্তোষজনক"?`${n.numberOfCommitteeMembers||0} জন`:"—"}],records:s.records,isLoading:s.isLoading,onLoadRecord:a=>{s.setEditingId(String(a.id??"")),f(h=>de(a,h)),p("showCause"),m(!1),window.scrollTo({top:0,behavior:"smooth"})},onDeleteRecord:s.remove,onReload:s.reload,auth:r,onAuthChange:o,onPrint:X,onPDF:me,lang:"bn",children:[!d&&c==="showCause"&&e.jsx($e,{data:n,setData:f,onGenerateNotice:()=>b(1)}),!d&&c==="reply"&&e.jsx(Me,{data:n,setData:f}),!d&&c==="nomination"&&e.jsx(_e,{data:n,setData:f,onGenerateNotice:()=>b(2)}),!d&&c==="committee"&&e.jsx(Oe,{data:n,setData:f,festivalHolidays:M,onGenerateNotice:()=>b(3)}),!d&&c==="evaluation"&&e.jsx(Le,{data:n,setData:f,onGenerateOutput:()=>b("evaluation")}),!d&&c==="finalDecision"&&e.jsx(Ue,{data:n,setData:f,festivalHolidays:M,onGenerateNotice4:()=>b(4)}),d&&e.jsx("div",{id:"printable-area",ref:l,children:e.jsx(Ze,{data:n,notice:x,authorization:r,festivalHolidays:M})})]}),I&&e.jsxs("div",{className:"da-flow-overlay",onClick:()=>A(!1),children:[e.jsx("button",{type:"button",className:"da-flow-close",onClick:()=>A(!1),"aria-label":"বন্ধ করুন",children:"✕"}),e.jsxs("div",{className:"da-flow-panel",onClick:a=>a.stopPropagation(),children:[e.jsx("div",{className:"da-flow-toolbar",children:e.jsx("button",{type:"button",className:"da-flow-btn",onClick:()=>X("process-flow-print-area"),children:"🖨 প্রিন্ট করুন"})}),e.jsx("div",{id:"process-flow-print-area",children:e.jsx(Qe,{data:n,festivalHolidays:M})})]})]})]})}export{dt as default};
