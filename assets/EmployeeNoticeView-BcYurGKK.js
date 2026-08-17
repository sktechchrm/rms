import{j as e,F as ee,A as te,r as b,u as q,b as ne,e as ae}from"./index--vlkhxAO.js";import{u as ie}from"./useDatabase-Bj29n6_g.js";import{P as re,D as se,M as oe,t as A}from"./ModuleShell-COIxJjFH.js";import{t as D}from"./bnEnDate-DcYhykOO.js";import{u as H,a as V,C as F,o as C,s as u}from"./schemas-CDuMJKIo.js";import{B as $,P as Y}from"./printCSS-BmQuLsHG.js";import"./DatabaseFactory-rSSh3BYg.js";import"./AuthorityIconButton-DGa-UujB.js";import"./DataUseCases-BZaAiVT1.js";const T={name:"",fatherName:"",motherName:"",gender:"",husbandName:"",designation:"",cardNo:"",section:"",date:"",joiningDate:"",absenceStartDate:"",firstNoticeDate:"",secondNoticeDate:"",thirdNoticeDate:"",companyName:"",companyAddress:"",presentAddress:{houseNo:"",village:"",postOffice:"",thana:"",district:""},permanentAddress:{houseNo:"",village:"",postOffice:"",thana:"",district:""}},v=t=>{if(!t)return"";const a=new Date(t),i=String(a.getDate()).padStart(2,"0"),n=String(a.getMonth()+1).padStart(2,"0"),d=a.getFullYear(),s=`${i}/${n}/${d}`;return D(s)},U="var(--app-font)",I={background:"#fff",border:"1px solid #E2E8F0",borderRadius:12,padding:"16px 18px",marginBottom:14},B={fontSize:14,fontWeight:700,color:"#0F2442",fontFamily:U,marginBottom:14,display:"flex",alignItems:"center",gap:6},de={display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12},k="var(--app-font)",_={width:"100%",height:36,padding:"0 11px",border:"1.5px solid #CBD5E1",borderRadius:7,fontFamily:k,fontSize:13,fontWeight:600,color:"#1A202C",background:"#FFFFFF",outline:"none",transition:"border-color .15s, box-shadow .15s",boxSizing:"border-box"};function x({label:t,required:a,optional:i,hint:n,hintColor:d,error:s,success:l,id:p,children:o}){return e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:4,marginBottom:0},children:[e.jsxs("label",{htmlFor:p,style:{fontSize:13,fontWeight:500,color:"#1A202C",display:"flex",alignItems:"center",gap:5,fontFamily:k},children:[t,a&&e.jsx("span",{style:{color:"#E24B4A",fontSize:13},"aria-hidden":"true",children:"*"}),i&&e.jsx("span",{style:{fontSize:11,padding:"1px 7px",borderRadius:99,background:"#F1F5F9",color:"#94A3B8",border:"0.5px solid #E2E8F0",fontWeight:400},children:"ঐচ্ছিক"})]}),o,n&&!s&&!l&&e.jsx("span",{style:{fontSize:12,color:d??"#94A3B8",fontFamily:k,lineHeight:1.4},children:n}),s&&e.jsxs("span",{role:"alert",style:{fontSize:12,color:"#E24B4A",display:"flex",alignItems:"center",gap:4,fontFamily:k},children:[e.jsx(ee,{"aria-hidden":"true",style:{fontSize:13,flexShrink:0}}),s]}),l&&e.jsxs("span",{role:"status",style:{fontSize:12,color:"#639922",display:"flex",alignItems:"center",gap:4,fontFamily:k},children:[e.jsx(te,{"aria-hidden":"true",style:{fontSize:13,flexShrink:0}}),l]})]})}function j({id:t,error:a,success:i,disabled:n,readOnly:d,style:s,...l}){const[p,o]=b.useState(!1),g=a?"#E24B4A":i?"#639922":p?"#378ADD":n||d?"#E2E8F0":"#CBD5E1",c=p?a?"0 0 0 3px rgba(226,75,74,.12)":i?"0 0 0 3px rgba(99,153,34,.12)":"0 0 0 3px rgba(55,138,221,.15)":"none";return e.jsx("input",{id:t,disabled:n,readOnly:d,"aria-invalid":a?!0:void 0,"aria-disabled":n?!0:void 0,"aria-readonly":d?!0:void 0,style:{..._,borderColor:g,boxShadow:c,background:n||d?"#F8FAFC":"#FFFFFF",color:n?"#94A3B8":d?"#4A5568":"#1A202C",cursor:n?"not-allowed":d?"default":"text",...s},onFocus:f=>{o(!0),l.onFocus?.(f)},onBlur:f=>{o(!1),l.onBlur?.(f)},...l})}function le({id:t,error:a,options:i,placeholder:n,style:d,...s}){const[l,p]=b.useState(!1);return e.jsxs("select",{id:t,"aria-invalid":a?!0:void 0,"aria-required":s.required,style:{..._,borderColor:a?"#E24B4A":l?"#378ADD":"#CBD5E1",boxShadow:l?"0 0 0 3px rgba(55,138,221,.15)":"none",appearance:"none",cursor:"pointer",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24'%3E%3Cpath fill='%2394a3b8' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 10px center",paddingRight:30,...d},onFocus:o=>{p(!0),s.onFocus?.(o)},onBlur:o=>{p(!1),s.onBlur?.(o)},...s,children:[n&&e.jsx("option",{value:"",disabled:!0,children:n}),i.map(o=>e.jsx("option",{value:o.value,children:o.label},o.value))]})}function ce({label:t,hint:a,checked:i,onChange:n,required:d,disabled:s,id:l}){const p=l??b.useId();return e.jsxs("label",{htmlFor:p,style:{display:"flex",alignItems:a?"flex-start":"center",gap:10,minHeight:44,cursor:s?"not-allowed":"pointer",fontFamily:k},children:[e.jsx("input",{type:"checkbox",id:p,checked:i,disabled:s,required:d,"aria-required":d,"aria-disabled":s,onChange:o=>n(o.target.checked),style:{width:18,height:18,accentColor:"#378ADD",cursor:s?"not-allowed":"pointer",flexShrink:0,marginTop:a?2:0}}),e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:13,color:s?"#94A3B8":"#1A202C"},children:t}),a&&e.jsx("div",{style:{fontSize:12,color:"#94A3B8",marginTop:1},children:a})]})]})}const R=C({houseNo:u().default(""),village:u().min(1,"গ্রাম / মহল্লা আবশ্যক"),postOffice:u().default(""),thana:u().default(""),district:u().min(1,"জেলা আবশ্যক")}),pe=C({name:u().min(1,"কর্মীর নাম আবশ্যক"),fatherName:u().default(""),motherName:u().default(""),cardNo:u().min(1,"কার্ড নং আবশ্যক"),designation:u().min(1,"পদবী আবশ্যক"),section:u().default(""),gender:u().min(1,"লিঙ্গ নির্বাচন করুন").refine(t=>["male","female","third"].includes(t),"লিঙ্গ নির্বাচন করুন"),husbandName:u().default(""),joiningDate:u().default(""),absenceDay:u().min(1,"দিন আবশ্যক").refine(t=>Number(t)>=1&&Number(t)<=31,"১–৩১ এর মধ্যে হতে হবে"),absenceMonth:u().min(1,"মাস আবশ্যক").refine(t=>Number(t)>=1&&Number(t)<=12,"১–১২ এর মধ্যে হতে হবে"),absenceYear:u().min(4,"বছর আবশ্যক").refine(t=>Number(t)>=1990&&Number(t)<=2100,"সঠিক বছর দিন")}),he=C({presentAddress:R,permanentAddress:R}),me={"02-21":"Language Day","03-26":"Independence Day","04-14":"Pohela Boishakh","05-01":"May Day","08-15":"National Mourning Day","12-16":"Victory Day"},ge=t=>`${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`in me,fe=t=>t.getDay()===5||t.getDay()===6,z=(t,a)=>{if(!t)return"";const i=new Date(t);let n=0;for(;n<a;)i.setDate(i.getDate()+1),!fe(i)&&!ge(i)&&n++;return i.toISOString().split("T")[0]},O=(t,a,i)=>{if(!t||!a||!i||i.length<4)return"";const n=Number(t),d=Number(a),s=Number(i);if(isNaN(n)||isNaN(d)||isNaN(s)||n<1||n>31||d<1||d>12||s<1900)return"";const l=`${s}-${String(d).padStart(2,"0")}-${String(n).padStart(2,"0")}`;return isNaN(new Date(l).getTime())?"":l};function P({title:t,titleEn:a,icon:i,prefix:n,disabled:d,control:s,errors:l}){return e.jsxs("div",{role:"group","aria-labelledby":`${n}-legend`,style:{flex:1,minWidth:200},children:[e.jsxs("div",{id:`${n}-legend`,style:{...B,marginBottom:10,fontSize:14},children:[t,e.jsxs("span",{style:{fontSize:12,color:"#94A3B8",fontWeight:400},children:["(",a,")"]})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12},children:[e.jsx(F,{name:`${n}.houseNo`,control:s,render:({field:p})=>e.jsx("div",{style:{gridColumn:"1 / -1"},children:e.jsx(x,{label:"বাড়ি / বাড়ি নং / রাস্তা",id:`${n}-houseNo`,children:e.jsx(j,{id:`${n}-houseNo`,...p,disabled:d,placeholder:"বাড়ি নং বা রাস্তার নাম"})})})}),e.jsx(F,{name:`${n}.village`,control:s,render:({field:p,fieldState:o})=>e.jsx(x,{label:"গ্রাম / মহল্লা",id:`${n}-village`,required:!0,error:o.error?.message,children:e.jsx(j,{id:`${n}-village`,...p,disabled:d,placeholder:"গ্রাম বা মহল্লা","aria-required":!0,"aria-invalid":!!o.error,"aria-describedby":o.error?`${n}-village-err`:void 0,error:!!o.error})})}),e.jsx(F,{name:`${n}.postOffice`,control:s,render:({field:p})=>e.jsx(x,{label:"ডাকঘর",id:`${n}-po`,children:e.jsx(j,{id:`${n}-po`,...p,disabled:d,placeholder:"ডাকঘরের নাম"})})}),e.jsx(F,{name:`${n}.thana`,control:s,render:({field:p})=>e.jsx(x,{label:"থানা",id:`${n}-thana`,children:e.jsx(j,{id:`${n}-thana`,...p,disabled:d,placeholder:"থানার নাম"})})}),e.jsx(F,{name:`${n}.district`,control:s,render:({field:p,fieldState:o})=>e.jsx(x,{label:"জেলা",id:`${n}-district`,required:!0,error:o.error?.message,children:e.jsx(j,{id:`${n}-district`,...p,disabled:d,placeholder:"জেলার নাম","aria-required":!0,"aria-invalid":!!o.error,error:!!o.error})})})]})]})}function ue({employee:t,onChange:a,onDirtyChange:i}){const{register:n,control:d,watch:s,formState:{errors:l,isDirty:p},trigger:o}=H({resolver:V(pe),mode:"onBlur",defaultValues:{name:t.name||"",fatherName:t.fatherName||"",motherName:t.motherName||"",cardNo:t.cardNo||"",designation:t.designation||"",section:t.section||"",gender:t.gender||"",husbandName:t.husbandName||"",joiningDate:t.joiningDate||"",absenceDay:t.absenceStartDate?.split("-")[2]||"",absenceMonth:t.absenceStartDate?.split("-")[1]||"",absenceYear:t.absenceStartDate?.split("-")[0]||""}}),g=s("gender"),c=s("absenceDay"),f=s("absenceMonth"),y=s("absenceYear");return b.useEffect(()=>{i?.(p)},[p,i]),b.useEffect(()=>{const m=O(c,f,y),N=m?z(m,10):"",w=N?z(N,10):"",S=w?z(w,7):"";a({...t,name:s("name"),fatherName:s("fatherName"),motherName:s("motherName"),cardNo:s("cardNo"),designation:s("designation"),section:s("section"),gender:s("gender"),husbandName:s("husbandName"),joiningDate:s("joiningDate"),absenceStartDate:m,firstNoticeDate:N,secondNoticeDate:w,thirdNoticeDate:S})},[c,f,y,g]),O(c,f,y),e.jsxs("div",{style:{paddingBottom:16},children:[e.jsxs("div",{style:I,children:[e.jsxs("div",{style:B,children:["সাধারণ তথ্য",e.jsx("span",{style:{fontSize:12,color:"#94A3B8",fontWeight:400},children:"Personal info"})]}),e.jsxs("div",{style:de,children:[e.jsx(x,{label:"কর্মীর নাম",required:!0,id:"pf-name",error:l.name?.message,children:e.jsx(j,{id:"pf-name",placeholder:"যেমন: রাহেলা বেগম","aria-required":!0,"aria-invalid":!!l.name,"aria-describedby":l.name?"pf-name-err":void 0,error:!!l.name,...n("name",{onChange:m=>a({...t,name:m.target.value})})})}),e.jsx(x,{label:"পিতার নাম",id:"pf-father",children:e.jsx(j,{id:"pf-father",placeholder:"পিতার নাম",...n("fatherName",{onChange:m=>a({...t,fatherName:m.target.value})})})}),e.jsx(x,{label:"মাতার নাম",id:"pf-mother",children:e.jsx(j,{id:"pf-mother",placeholder:"মাতার নাম",...n("motherName",{onChange:m=>a({...t,motherName:m.target.value})})})}),e.jsx(x,{label:"কার্ড নং",required:!0,id:"pf-card",error:l.cardNo?.message,children:e.jsx(j,{id:"pf-card",placeholder:"যেমন: EMP-0042","aria-required":!0,"aria-invalid":!!l.cardNo,error:!!l.cardNo,...n("cardNo",{onChange:m=>a({...t,cardNo:m.target.value})})})}),e.jsx(x,{label:"পদবী",required:!0,id:"pf-desg",error:l.designation?.message,children:e.jsx(j,{id:"pf-desg",placeholder:"যেমন: অপারেটর","aria-required":!0,"aria-invalid":!!l.designation,error:!!l.designation,...n("designation",{onChange:m=>a({...t,designation:m.target.value})})})}),e.jsx(x,{label:"সেকশন",id:"pf-section",children:e.jsx(j,{id:"pf-section",placeholder:"যেমন: সুইং",...n("section",{onChange:m=>a({...t,section:m.target.value})})})}),e.jsx(x,{label:"লিঙ্গ",required:!0,id:"pf-gender",error:l.gender?.message,children:e.jsx(F,{name:"gender",control:d,render:({field:m,fieldState:N})=>e.jsx(le,{id:"pf-gender",value:m.value??"","aria-required":!0,"aria-invalid":!!N.error,error:!!N.error,placeholder:"লিঙ্গ নির্বাচন করুন",options:[{value:"male",label:"পুরুষ (Male)"},{value:"female",label:"নারী (Female)"},{value:"third",label:"অ-দ্বৈত / তৃতীয় লিঙ্গ"}],onChange:w=>{m.onChange(w),a({...t,gender:w.target.value})},onBlur:m.onBlur})})}),g==="female"&&e.jsx(x,{label:"স্বামীর নাম",id:"pf-husband",children:e.jsx(j,{id:"pf-husband",placeholder:"স্বামীর নাম",...n("husbandName",{onChange:m=>a({...t,husbandName:m.target.value})})})}),e.jsx(x,{label:"যোগদানের তারিখ",id:"pf-join",children:e.jsx(j,{id:"pf-join",type:"date",...n("joiningDate",{onChange:m=>a({...t,joiningDate:m.target.value})})})})]})]}),e.jsxs("div",{style:I,children:[e.jsxs("div",{style:B,children:["অনুপস্থিতির তারিখ",e.jsx("span",{style:{fontSize:12,color:"#94A3B8",fontWeight:400},children:"Absence start date"})]}),e.jsxs("fieldset",{style:{border:"none",padding:0},children:[e.jsx("legend",{style:{fontSize:12,color:"#64748B",marginBottom:10,fontFamily:U},children:"দিন, মাস ও বছর আলাদাভাবে লিখুন"}),e.jsxs("div",{style:{display:"flex",gap:12,alignItems:"flex-start"},children:[e.jsx(x,{label:"দিন",id:"pf-abs-day",hint:"১–৩১",error:l.absenceDay?.message,children:e.jsx(j,{id:"pf-abs-day",type:"number",min:1,max:31,placeholder:"দিন",style:{textAlign:"center"},"aria-required":!0,"aria-invalid":!!l.absenceDay,error:!!l.absenceDay,...n("absenceDay",{onBlur:()=>o(["absenceDay","absenceMonth","absenceYear"])})})}),e.jsx(x,{label:"মাস",id:"pf-abs-month",hint:"১–১২",error:l.absenceMonth?.message,children:e.jsx(j,{id:"pf-abs-month",type:"number",min:1,max:12,placeholder:"মাস",style:{textAlign:"center"},"aria-required":!0,"aria-invalid":!!l.absenceMonth,error:!!l.absenceMonth,...n("absenceMonth",{onBlur:()=>o(["absenceDay","absenceMonth","absenceYear"])})})}),e.jsx(x,{label:"বছর",id:"pf-abs-year",hint:"যেমন: ২০২৬",error:l.absenceYear?.message,children:e.jsx(j,{id:"pf-abs-year",type:"number",min:1990,max:2100,placeholder:"বছর","aria-required":!0,"aria-invalid":!!l.absenceYear,error:!!l.absenceYear,...n("absenceYear",{onBlur:()=>o(["absenceDay","absenceMonth","absenceYear"])})})})]})]})]})]})}function xe({employee:t,onChange:a,onDirtyChange:i}){const[n,d]=b.useState(!1),{control:s,watch:l,setValue:p,formState:{isDirty:o}}=H({resolver:V(he),mode:"onBlur",defaultValues:{presentAddress:{...t.presentAddress,houseNo:t.presentAddress.houseNo||""},permanentAddress:{...t.permanentAddress,houseNo:t.permanentAddress.houseNo||""}}});b.useEffect(()=>{i?.(o)},[o,i]);const g=l("presentAddress");b.useEffect(()=>{n&&(p("permanentAddress",{...g},{shouldDirty:!0}),a({...t,permanentAddress:{...g}}))},[g,n]);const c=l("presentAddress"),f=l("permanentAddress");return b.useEffect(()=>{a({...t,presentAddress:c,permanentAddress:f})},[c,f]),e.jsx("div",{style:{paddingBottom:16},children:e.jsxs("div",{style:I,children:[e.jsxs("div",{style:{...B,justifyContent:"space-between",marginBottom:14},children:[e.jsxs("span",{style:{display:"flex",alignItems:"center",gap:8},children:["ঠিকানা",e.jsx("span",{style:{fontSize:12,color:"#94A3B8",fontWeight:400},children:"(Addresses)"})]}),e.jsx(ce,{id:"addr-same",label:"উভয় ঠিকানা একই",hint:"টিক করলে স্থায়ী ঠিকানা স্বয়ংক্রিয়ভাবে পূরণ হবে",checked:n,onChange:y=>{d(y),y&&(p("permanentAddress",{...g},{shouldDirty:!0}),a({...t,permanentAddress:{...g}}))}})]}),e.jsxs("div",{style:{display:"flex",gap:16,flexWrap:"wrap"},children:[e.jsx("div",{style:{flex:1,minWidth:200,border:"1px solid #BFDBFE",borderRadius:10,padding:"14px 16px",background:"#FAFEFF"},children:e.jsx(P,{title:"বর্তমান ঠিকানা",titleEn:"Present address",icon:"ti-map-pin",prefix:"presentAddress",disabled:!1,control:s,errors:{}})}),e.jsx("div",{style:{display:"flex",alignItems:"center",color:"#CBD5E1",fontSize:20,userSelect:"none"},"aria-hidden":"true",children:n?"=":"≠"}),e.jsx("div",{style:{flex:1,minWidth:200,border:`1px solid ${n?"#E2E8F0":"#86EFAC"}`,borderRadius:10,padding:"14px 16px",background:n?"#F8FAFC":"#F0FDF4",opacity:n?.6:1,transition:"opacity .2s, border-color .2s"},children:e.jsx(P,{title:"স্থায়ী ঠিকানা",titleEn:"Permanent address",icon:"ti-home",prefix:"permanentAddress",disabled:n,control:s,errors:{}})})]})]})})}const be=({employee:t,onChange:a,activeTab:i="personal",onDirtyChange:n})=>{const d=b.useCallback(s=>n?.(s),[n]);return i==="personal"?e.jsx(ue,{employee:t,onChange:a,onDirtyChange:d}):e.jsx(xe,{employee:t,onChange:a,onDirtyChange:d})},je=({employee:t,title:a,content:i,authorization:n,noticeType:d})=>{const s=["শ্রমিকের ব্যক্তিগত নথি।","সংশ্লিষ্ট ব্যক্তি।"],p=(()=>{switch(d){case"notice1":return{absenceDate:v(t.absenceStartDate||""),noticeDate:v(t.firstNoticeDate||"")};case"notice2":return{absenceDate:v(t.absenceStartDate||""),firstNoticeDate:v(t.firstNoticeDate||""),noticeDate:v(t.secondNoticeDate||"")};case"notice3":return{absenceDate:v(t.absenceStartDate||""),firstNoticeDate:v(t.firstNoticeDate||""),secondNoticeDate:v(t.secondNoticeDate||""),noticeDate:v(t.thirdNoticeDate||"")};default:return{}}})(),o=()=>{if(i)return i;switch(d){case"notice1":return e.jsxs(e.Fragment,{children:[e.jsx("p",{className:"nl-subject",children:"বিষয় : বাংলাদেশ শ্রম আইন ২০০৬ এর ২৭ (৩ক) ধারা মোতাবেক ব্যাখ্যা প্রদান সহ চাকুরীতে যোগদানের জন্য নোটিশ।"}),e.jsx("p",{className:"nl-salute",children:"জনাব/জনাবা,"}),e.jsxs("p",{className:"nl-para",children:["আপনি গত ",e.jsx("u",{children:e.jsx("strong",{children:p.absenceDate})})," ইং তারিখ থেকে কারখানা কর্তৃপক্ষের বিনা অনুমতিতে কর্মস্থলে অনুপস্থিত রয়েছেন। আপনার এরূপ অনুপস্থিতি বাংলাদেশ শ্রম আইন ২০০৬ এর ২৭ (৩ক) ধারার আওতায় পড়ে।"]}),e.jsx("p",{className:"nl-para",children:"সুতরাং অত্র পত্র প্রাপ্তির ১০ (দশ) দিনের মধ্যে আপনার অনুপস্থিতির কারণ ব্যাখ্যা সহ কাজে যোগদানের জন্য আপনাকে নির্দেশ দেয়া হলো।"}),e.jsx("p",{className:"nl-para",children:"আপনার লিখিত জবাব উক্ত সময়ের মধ্যে নিম্নস্বাক্ষরকারীর নিকট অবশ্যই পৌঁছাতে হবে। অন্যথায় কর্তৃপক্ষ আপনার বিরুদ্ধে প্রয়োজনীয় আইনানুগ ব্যবস্থা নিতে বাধ্য হবে।"})]});case"notice2":return e.jsxs(e.Fragment,{children:[e.jsx("p",{className:"nl-subject",children:"বিষয় : বাংলাদেশ শ্রম আইন ২০০৬ এর ২৭ (৩ক) ধারা মোতাবেক আত্মপক্ষ সমর্থনের সুযোগ প্রদান প্রসঙ্গে।"}),e.jsx("p",{className:"nl-salute",children:"জনাব/জনাবা,"}),e.jsxs("p",{className:"nl-para",children:["আপনি গত ",e.jsx("u",{children:e.jsx("strong",{children:p.absenceDate})})," ইং তারিখ থেকে কারখানা কর্তৃপক্ষের বিনা অনুমতিতে কর্মস্থলে অনুপস্থিত রয়েছেন। এ প্রেক্ষিতে কারখানা কর্তৃপক্ষ আপনার স্থায়ী ও বর্তমান ঠিকানায় রেজিস্ট্রি ডাকযোগে গত ",e.jsx("u",{children:e.jsx("strong",{children:p.firstNoticeDate})})," ইং তারিখে বিনানুমতিতে চাকুরীতে অনুপস্থিতির কারণ ব্যাখ্যা সহ কাজে যোগদানের জন্য পত্র প্রেরণ করা হয়। কিন্তু অদ্যবধি আপনি উপরোক্ত বিষয়ে কোন ধরণের লিখিত ব্যাখ্যা প্রদান করেন নাই অথবা চাকুরীতেও যোগদান করেন নাই।"]}),e.jsx("p",{className:"nl-para",children:"অতএব, অত্র পত্র প্রাপ্তির ০৭ (সাত) দিনের মধ্যে আত্মপক্ষ সমর্থন সহ কাজে যোগদান করিতে আপনাকে নির্দেশ দেয়া গেল।"}),e.jsx("p",{className:"nl-para",children:"উক্ত সময়ের মধ্যে আপনি আত্মপক্ষ সমর্থনের জবাব সহ কাজে যোগদান করতে ব্যর্থ হলে বাংলাদেশ শ্রম আইন ২০০৬ এর ২৭ (৩ক) ধারা অনুযায়ী আপনি স্বেচ্ছায় চাকুরী থেকে ইস্তফা গ্রহণ করেছেন বলে গণ্য হবে।"})]});case"notice3":return e.jsxs(e.Fragment,{children:[e.jsx("p",{className:"nl-subject",children:"বিষয় : বাংলাদেশ শ্রম আইন ২০০৬ এর ২৭ (৩ক) ধারা মোতাবেক শ্রমিক কর্তৃক স্বেচ্ছায় চাকুরী হইতে ইস্তফা প্রসঙ্গে।"}),e.jsx("p",{className:"nl-salute",children:"জনাব/জনাবা,"}),e.jsxs("p",{className:"nl-para",children:["আপনি গত ",e.jsx("u",{children:e.jsx("strong",{children:p.absenceDate})})," ইং তারিখ হতে অদ্যবধি পর্যন্ত কর্তৃপক্ষের বিনা অনুমতিতে কর্মস্থলে অনুপস্থিত থাকার আপনাকে গত ",e.jsx("u",{children:e.jsx("strong",{children:p.firstNoticeDate})})," ইং তারিখে একটি পত্রের মাধ্যমে ১০ (দশ) দিনের সময় দিয়ে চাকুরীতে যোগদান সহ ব্যাখ্যা প্রদান করতে বলা হয়েছিল। কিন্তু আপনি নির্ধারিত সময়ের মধ্যে কর্মস্থলে উপস্থিত হননি এবং কোন ব্যাখ্যা প্রদান করেননি।"]}),e.jsxs("p",{className:"nl-para",children:["তথাপি কর্তৃপক্ষ গত ",e.jsx("u",{children:e.jsx("strong",{children:p.secondNoticeDate})})," ইং তারিখে আর একটি পত্রের মাধ্যমে আপনাকে আরো ৭ (সাত) দিনের সময় দিয়ে আত্মপক্ষ সমর্থন সহ চাকুরীতে যোগদানের জন্য পুনরায় নির্দেশ প্রদান করেন। তৎসত্ত্বেও আপনি নির্ধারিত সময়ের মধ্যে আত্মপক্ষ করেননি এবং যোগদান করেননি।"]}),e.jsx("p",{className:"nl-para",children:"সুতরাং বাংলাদেশ শ্রম আইন, ২০০৬ এর ২৭ (৩ক) ধারা অনুযায়ী অনুপস্থিত দিন থেকে আপনি চাকুরী হতে স্বেচ্ছায় ইস্তফা গ্রহণ করেছেন বলে গণ্য করা হলো।"}),e.jsx("p",{className:"nl-para",children:"অতএব, আপনার বকেয়া মজুরী ও আইনানুগ পাওনা (যদি থাকে) যে কোন কর্মদিবসে অফিস চলাকালীন সময়ে কারখানার হিসাব শাখা থেকে গ্রহণ করার জন্য নির্দেশ দেয়া গেল।"})]});default:return null}};return e.jsxs("div",{className:"nl-page",children:[e.jsxs("div",{className:"nl-wrap",children:[e.jsxs("div",{className:"nl-header",children:[t.companyName&&e.jsx("h1",{className:"nl-co-name",children:t.companyName}),t.companyAddress&&e.jsx("p",{className:"nl-co-addr",children:t.companyAddress})]}),e.jsxs("div",{className:"nl-title-bar",children:[e.jsx("h2",{className:"nl-title",children:'"রেজিস্টার্ড ডাকযোগে প্রেরিত"'}),p.noticeDate&&e.jsxs("div",{className:"nl-meta",children:[e.jsxs("span",{className:"nl-meta-type",children:["(",a,")"]}),e.jsxs("span",{className:"nl-meta-date",children:["তারিখ : ",e.jsxs("strong",{children:[D(p.noticeDate)," ইং"]})]})]})]}),e.jsx("p",{className:"nl-to",children:"প্রতি,"}),e.jsxs("div",{className:"nl-emp-box",children:[e.jsxs("div",{className:"nl-emp-col",children:[e.jsx("div",{className:"nl-emp-head",children:"ব্যক্তিগত তথ্য"}),e.jsx("table",{className:"nl-emp-tbl",children:e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:"নাম"}),e.jsx("td",{children:t.name||"—"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"পিতার নাম"}),e.jsx("td",{children:t.fatherName||"—"})]}),t.motherName&&e.jsxs("tr",{children:[e.jsx("td",{children:"মাতার নাম"}),e.jsx("td",{children:t.motherName})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"পদবী"}),e.jsx("td",{children:t.designation||"—"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"কার্ড নং"}),e.jsx("td",{children:t.cardNo||"—"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"সেকশন"}),e.jsx("td",{children:t.section||"—"})]}),t.joiningDate&&e.jsxs("tr",{children:[e.jsx("td",{children:"যোগদান"}),e.jsx("td",{children:v(t.joiningDate)})]})]})})]}),e.jsx("div",{className:"nl-emp-divider"}),e.jsxs("div",{className:"nl-emp-col",children:[e.jsx("div",{className:"nl-emp-head",children:"বর্তমান ঠিকানা"}),e.jsx("table",{className:"nl-emp-tbl",children:e.jsxs("tbody",{children:[t.presentAddress.houseNo&&e.jsxs("tr",{children:[e.jsx("td",{children:"বাড়ি"}),e.jsx("td",{children:t.presentAddress.houseNo})]}),t.presentAddress.village&&e.jsxs("tr",{children:[e.jsx("td",{children:"গ্রাম"}),e.jsx("td",{children:t.presentAddress.village})]}),t.presentAddress.postOffice&&e.jsxs("tr",{children:[e.jsx("td",{children:"ডাকঘর"}),e.jsx("td",{children:t.presentAddress.postOffice})]}),t.presentAddress.thana&&e.jsxs("tr",{children:[e.jsx("td",{children:"থানা"}),e.jsx("td",{children:t.presentAddress.thana})]}),t.presentAddress.district&&e.jsxs("tr",{children:[e.jsx("td",{children:"জেলা"}),e.jsx("td",{children:t.presentAddress.district})]})]})})]}),e.jsx("div",{className:"nl-emp-divider"}),e.jsxs("div",{className:"nl-emp-col",children:[e.jsx("div",{className:"nl-emp-head",children:"স্থায়ী ঠিকানা"}),e.jsx("table",{className:"nl-emp-tbl",children:e.jsxs("tbody",{children:[t.permanentAddress.houseNo&&e.jsxs("tr",{children:[e.jsx("td",{children:"বাড়ি"}),e.jsx("td",{children:t.permanentAddress.houseNo})]}),t.permanentAddress.village&&e.jsxs("tr",{children:[e.jsx("td",{children:"গ্রাম"}),e.jsx("td",{children:t.permanentAddress.village})]}),t.permanentAddress.postOffice&&e.jsxs("tr",{children:[e.jsx("td",{children:"ডাকঘর"}),e.jsx("td",{children:t.permanentAddress.postOffice})]}),t.permanentAddress.thana&&e.jsxs("tr",{children:[e.jsx("td",{children:"থানা"}),e.jsx("td",{children:t.permanentAddress.thana})]}),t.permanentAddress.district&&e.jsxs("tr",{children:[e.jsx("td",{children:"জেলা"}),e.jsx("td",{children:t.permanentAddress.district})]})]})})]})]}),e.jsx("div",{className:"nl-body",children:o()}),d&&e.jsxs("div",{className:"nl-copy",children:[e.jsx("p",{children:e.jsx("strong",{children:e.jsx("u",{children:"অনুলিপি :"})})}),e.jsx("ol",{children:s.map((g,c)=>e.jsxs("li",{children:[e.jsxs("span",{children:[D(String(c+1)),"."]}),g]},c))})]}),d&&e.jsxs("div",{className:"nl-footer",children:[e.jsx("p",{className:"nl-authority",children:"কর্তৃপক্ষের নির্দেশক্রমে"}),n&&e.jsx(re,{value:n,lang:"bn",hidePrepared:!0,hideTopBorder:!0})]})]}),e.jsx("style",{children:`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap');

        /* ─── Shared font ─────────────────────────────────── */
        .nl-page, .nl-page * {
          font-family: 'Noto Sans Bengali', 'Noto Sans', Arial, sans-serif;
          box-sizing: border-box;
        }

        /* ─── Screen: A4 card preview ─────────────────────── */
        .nl-page {
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          background: #fff;
          box-shadow: 0 4px 24px rgba(0,0,0,0.12);
          border-radius: 6px;
          padding: 18mm 16mm;
        }

        /* Full-height flex column so body grows to fill page */
        .nl-wrap {
          display: flex;
          flex-direction: column;
          min-height: calc(297mm - 36mm); /* page height minus paddings */
          gap: 0;
        }

        /* ─── Header ──────────────────────────────────────── */
        .nl-header {
          text-align: center;
          border-bottom: 2.5px solid #1d4ed8;
          padding-bottom: 10px;
          margin-bottom: 10px;
        }
        .nl-co-name {
          font-size: 20px;
          font-weight: 700;
          color: #1e3a5f;
          letter-spacing: 0.5px;
          margin: 0 0 3px;
          text-transform: uppercase;
        }
        .nl-co-addr { font-size: 13px; color: #374151; margin: 0; }

        /* ─── Title bar ────────────────────────────────────── */
        .nl-title-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 0 6px;
          border-bottom: 1px dashed #d1d5db;
          margin-bottom: 8px;
          flex-wrap: wrap;
          gap: 4px;
        }
        .nl-title {
          font-size: 15px;
          font-weight: 700;
          text-decoration: underline;
          text-underline-offset: 3px;
          margin: 0;
          color: #111827;
        }
        .nl-meta { display: flex; flex-direction: column; align-items: flex-end; font-size: 13px; gap: 2px; }
        .nl-meta-type { color: #1d4ed8; font-weight: 600; }
        .nl-meta-date { color: #374151; }

        /* ─── To ───────────────────────────────────────────── */
        .nl-to { font-size: 14px; font-weight: 600; margin: 4px 0 6px; }

        /* ─── Employee info box ────────────────────────────── */
        .nl-emp-box {
          display: flex;
          gap: 0;
          border: 1.5px solid #374151;
          border-radius: 5px;
          overflow: hidden;
          margin-bottom: 14px;
        }
        .nl-emp-col { flex: 1; padding: 10px 12px; }
        .nl-emp-divider { width: 1.5px; background: #374151; flex-shrink: 0; }
        .nl-emp-head {
          font-size: 12.5px;
          font-weight: 700;
          border-bottom: 1.5px solid #374151;
          padding-bottom: 5px;
          margin-bottom: 6px;
          color: #111827;
          letter-spacing: 0.2px;
        }
        .nl-emp-tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
        .nl-emp-tbl td { padding: 2px 4px 2px 0; vertical-align: top; line-height: 1.5; }
        .nl-emp-tbl td:first-child { font-weight: 600; white-space: nowrap; padding-right: 6px; width: 38%; }
        .nl-emp-tbl td:first-child::after { content: ':'; }

        /* ─── Notice body — grows to fill available space ─── */
        .nl-body {
          flex: 1;                    /* ← key: push footer to bottom    */
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          gap: 0;
          margin-bottom: 14px;
        }
        .nl-subject {
          font-weight: 700;
          text-decoration: underline;
          text-underline-offset: 2px;
          font-size: 13.5px;
          line-height: 1.7;
          margin: 0 0 10px;
        }
        .nl-salute { font-size: 14px; font-weight: 600; margin: 0 0 10px; }
        .nl-para {
          font-size: 13.5px;
          line-height: 1.85;
          text-align: justify;
          margin: 0 0 12px;
        }

        /* ─── Copy list ────────────────────────────────────── */
        .nl-copy { font-size: 13px; margin-bottom: 12px; }
        .nl-copy p { margin: 0 0 4px; }
        .nl-copy ol { list-style: none; padding: 0; margin: 0; }
        .nl-copy li { display: flex; gap: 6px; margin-bottom: 2px; }
        .nl-copy li span { font-weight: 600; flex-shrink: 0; }

        /* ─── Footer ───────────────────────────────────────── */
        .nl-footer { margin-top: auto; padding-top: 8px; }
        .nl-authority { font-size: 13.5px; font-weight: 700; margin: 0 0 4px; }

        /* ════════════════════════════════════════════════════
           PRINT — single A4 page, dynamically fills the sheet
           ════════════════════════════════════════════════════ */
        ${$}

        @media print {
          @page {
            size: A4 portrait;
            margin: 14mm 15mm 14mm 15mm;
          }

          /* Hide everything except this notice */
          body * { visibility: hidden !important; }
          .nl-page, .nl-page * { visibility: visible !important; }

          /* Reset screen decoration */
          .nl-page {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            min-height: unset !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: white !important;
          }

          /* nl-wrap fills the full printed page height so space
             is distributed — flex-grow on nl-body spreads the
             notice paragraphs to occupy any leftover whitespace */
          .nl-wrap {
            min-height: calc(297mm - 28mm) !important; /* A4 - margins */
            height:     calc(297mm - 28mm) !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Scale everything to 10.5pt base */
          .nl-co-name    { font-size: 13.5pt !important; margin-bottom: 2pt !important; }
          .nl-co-addr    { font-size: 9pt !important; }
          .nl-header     { border-bottom-width: 2pt !important; padding-bottom: 6pt !important; margin-bottom: 7pt !important; border-color: #000 !important; }

          .nl-title-bar  { padding: 5pt 0 4pt !important; margin-bottom: 6pt !important; border-color: #555 !important; }
          .nl-title      { font-size: 11.5pt !important; }
          .nl-meta       { font-size: 9.5pt !important; }
          .nl-meta-type  { color: #000 !important; }

          .nl-to         { font-size: 10pt !important; margin: 3pt 0 4pt !important; }

          /* Employee box */
          .nl-emp-box    { margin-bottom: 10pt !important; border-color: #000 !important; border-radius: 0 !important; }
          .nl-emp-col    { padding: 7pt 9pt !important; }
          .nl-emp-divider{ background: #000 !important; }
          .nl-emp-head   { font-size: 9.5pt !important; padding-bottom: 3pt !important; margin-bottom: 4pt !important; border-color: #000 !important; }
          .nl-emp-tbl    { font-size: 8.8pt !important; }
          .nl-emp-tbl td { padding: 1.5pt 3pt 1.5pt 0 !important; line-height: 1.45 !important; }

          /* Body — flex-grow + justify-content: space-between
             distributes paragraph spacing to fill the page     */
          .nl-body {
            flex: 1 !important;
            justify-content: space-between !important;
            margin-bottom: 10pt !important;
          }
          .nl-subject  { font-size: 9.5pt !important; line-height: 1.55 !important; margin-bottom: 8pt !important; }
          .nl-salute   { font-size: 10pt !important; margin-bottom: 8pt !important; }
          .nl-para     {
            font-size: 10pt !important;
            line-height: 1.75 !important;
            margin-bottom: 0 !important; /* space-between handles gaps */
          }

          .nl-copy       { font-size: 9pt !important; margin-bottom: 8pt !important; }
          .nl-copy li    { margin-bottom: 1.5pt !important; }

          .nl-footer     { padding-top: 6pt !important; }
          .nl-authority  { font-size: 10pt !important; margin-bottom: 3pt !important; }

          /* Prevent footer from ever splitting */
          .nl-footer {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `})]})};function L({employee:t,address:a,addressLabel:i}){const n=q(),d=[a.houseNo,a.village,a.postOffice,a.thana,a.district].filter(Boolean).join(", ");return e.jsx("div",{className:"envelope-container",children:e.jsx("div",{className:"envelope",children:e.jsxs("div",{style:{display:"flex",alignItems:"flex-start",justifyContent:"flex-start",width:"100%",marginTop:"15mm",fontSize:"16pt",boxSizing:"border-box"},children:[e.jsxs("div",{style:{width:"42%",marginRight:"75mm"},children:[e.jsx("div",{style:{fontWeight:700},children:"হইতে,"}),e.jsx("div",{style:{fontSize:"18pt",fontWeight:700,whiteSpace:"nowrap"},children:t.companyName||n.nameEn}),e.jsx("div",{style:{fontSize:"14pt",fontWeight:400,lineHeight:1.4},children:t.companyAddress||"৩২, লক্ষীপুরা, চন্দনা, জয়দেবপুর, গাজীপুর-১৭০০"})]}),e.jsxs("div",{style:{width:"42%"},children:[e.jsx("div",{style:{fontWeight:700},children:"প্রতি,"}),e.jsx("div",{style:{fontWeight:400,marginBottom:"3mm"},children:i}),e.jsxs("div",{style:{fontSize:"18pt",fontWeight:700,whiteSpace:"nowrap"},children:["নাম: ",t.name||"Employee Name"]}),(t.fatherName||t.husbandName)&&e.jsx("div",{style:{fontWeight:400,whiteSpace:"nowrap"},children:t.fatherName?`পিতা: ${t.fatherName}`:`স্বামী: ${t.husbandName}`}),d&&e.jsxs("div",{style:{fontWeight:400,lineHeight:1.5,marginTop:"3mm"},children:["ঠিকানা: ",d]})]})]})})})}const Ne=({employee:t,addressType:a="both"})=>{const i=a==="present"||a==="both",n=a==="permanent"||a==="both";return e.jsxs("div",{className:"envelope-page",children:[i&&e.jsx(L,{employee:t,address:t.presentAddress,addressLabel:"(বর্তমান ঠিকানা)"}),n&&e.jsx(L,{employee:t,address:t.permanentAddress,addressLabel:"(স্থায়ী ঠিকানা)"}),e.jsx("style",{children:`
        ${$}
        ${Y}

        .envelope-page {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
          padding: 24px 0;
          width: 100%;
          overflow-x: auto;
        }

        .envelope-container {
          width: 220mm;
          flex-shrink: 0;
        }

        .envelope {
          position: relative;
          width: 220mm;
          height: 110mm;
          background: #fff;
          border: 1px solid #d1d5db;
          box-shadow: 0 2px 10px rgba(0,0,0,0.08);
          box-sizing: border-box;
          padding: 10mm 12mm;
        }

        @media print {
          /* Matches the tray's actual PORTRAIT orientation (110mm wide x
             220mm tall) instead of fighting it — see file-header FIX
             comment. */
          @page { size: 110mm 220mm; margin: 1in 0.75in 1in 0.75in; }

          /* 6th-round fix: print output should never be bold, regardless
             of what any individual line's inline style specifies (the
             screen preview keeps its own bold weights for on-screen
             legibility — this override only applies inside @media
             print). !important is needed since it must outrank the
             inline fontWeight styles set in the JSX above. */
          .envelope, .envelope * { font-weight: 400 !important; }

          /* ISOLATION (3rd round fix): hide EVERYTHING else in the app —
             sidebar, the "Skip to main content" accessibility skip-link,
             all of it — and reveal only this component's own output.
             Without this pair, the whole surrounding app shell prints as
             its own full page BEFORE the actual envelope page, which is
             exactly the reported extra blank/UI-chrome first page. This
             mirrors the same visibility pair every sibling notice/letter
             component in this codebase already uses (e.g. .nl-page,
             .nl-page * { visibility: visible } in
             DisciplinaryNoticeLetter.tsx) — this component was simply
             missing its own version of it until now. */
          body * { visibility: hidden !important; }
          .envelope-page, .envelope-page * { visibility: visible !important; }

          /* ModuleShell's root container (and other ancestors) carry
             overflow:hidden as an inline style which clips its rendered
             content box regardless of child positioning. Since this is a
             shared component we can't edit, force every ancestor to
             overflow:visible in print so our positioned envelope content
             isn't clipped to a tiny visible region. */
          html, body, body * {
            overflow: visible !important;
          }

          /* Width now matches the page's REAL print width (110mm
             portrait), not the 220mm landscape design width — that 220mm
             value was correct for the OLD (landscape @page) approach but
             is wrong now that @page itself is portrait. */
          html, body { width: 110mm; height: auto; }

          /* ISOLATION (4th round fix — blank page still appeared after
             the visibility fix above): visibility:hidden hides content
             VISUALLY but the hidden elements still occupy their full
             layout space. So the entire app shell above this component
             (navbar, sidebar, the skip-link, etc.) was invisible but
             still reserved its full height in the document's normal
             flow — pushing .envelope-page down far enough that it
             spilled onto a second page, with the first page showing
             nothing but that reserved blank space. FIX: pull
             .envelope-page OUT of normal document flow entirely with
             position: absolute; top: 0; left: 0, so it no longer cares
             how much space the (still invisible) preceding elements
             take up — same technique the sibling notice/letter
             components in this codebase use (e.g. .nl-page { position:
             absolute; inset: 0 } in DisciplinaryNoticeLetter.tsx).
             .envelope-container below stays in NORMAL flow relative to
             THIS element (its own containing block once positioned), so
             page-break-after between the two envelopes is unaffected. */
          .envelope-page {
            position: absolute;
            top: 0;
            left: 0;
            display: block;
            width: 110mm;
            padding: 0;
            gap: 0;
            overflow: visible;
          }

          .envelope-container {
            /* This IS the physical page slot now: sized to match the
               real portrait page (110mm x 220mm) exactly, one per
               printed sheet. The actual landscape-shaped envelope design
               lives inside it, rotated — see .envelope below. */
            width: 110mm;
            height: 220mm;
            position: relative;
            margin: 0;
            overflow: hidden;
            page-break-after: always;
            page-break-inside: avoid;
          }
          .envelope-container:last-child { page-break-after: avoid; }

          .envelope {
            /* The real 220mm x 110mm landscape design, rotated 90° to
               fit inside the 110mm x 220mm portrait page slot above.
               Standard landscape-in-portrait technique: position the
               unrotated box's top-left corner at (110mm, 0) in page
               coordinates, then rotate 90° around that same corner
               (transform-origin: top left) — the box's occupied region
               then maps exactly onto the 0–110mm / 0–220mm page area.
               Once physically printed on the portrait-fed sheet and the
               envelope is picked up and read normally, this appears
               correctly oriented as a landscape envelope. */
            position: absolute;
            top: 0;
            left: 110mm;
            width: 220mm;
            height: 110mm;
            transform: rotate(90deg);
            transform-origin: top left;
            box-shadow: none;
            /* No border in print (3rd round fix) — the screen-only
               preview border above (#d1d5db) is a visual aid for the
               in-app preview; the printed envelope itself should be
               border-free. Explicitly set here rather than relying on
               the cascade, so nothing else can reintroduce one. */
            border: none;
          }
        }
      `})]})},ve=[{id:"personal",label:"সাধারণ তথ্য",icon:"ti-user-circle"},{id:"address",label:"ঠিকানা",icon:"ti-map-pin"}],W={male:"male",m:"male",পুরুষ:"male",female:"female",f:"female",নারী:"female",মহিলা:"female",third:"third",other:"third",others:"third",trans:"third",transgender:"third",তৃতীয়:"third","তৃতীয় লিঙ্গ":"third","অ-দ্বৈত":"third",হিজড়া:"third"},ye=t=>{const a=String(t??"").trim();if(!a)return"";const i=a.toLowerCase();return W[i]??W[a]??a};function M(t,a){let i={};try{i=JSON.parse(String(t.addressesJson??"{}"))??{}}catch{}return{...a,name:String(t.employeeName??""),fatherName:String(t.fatherName??""),motherName:String(t.motherName??""),gender:String(t.gender??""),husbandName:String(t.husbandName??""),cardNo:String(t.cardNo??""),designation:String(t.designation??""),section:String(t.department??""),date:A(t.date),joiningDate:A(t.joiningDate),absenceStartDate:A(t.absentFrom),firstNoticeDate:A(t.firstNoticeDate),secondNoticeDate:A(t.secondNoticeDate),thirdNoticeDate:A(t.thirdNoticeDate),presentAddress:i.present??a.presentAddress,permanentAddress:i.permanent??a.permanentAddress}}function Ie(){const t=q(),{user:a}=ne(),i=ie("leftnotice",t.id,a?.name??"unknown"),n=b.useRef(null),[d,s]=b.useState(se),[l,p]=b.useState(!1),[o,g]=b.useState("personal"),[c,f]=b.useState(T),[y,m]=b.useState(0),N=()=>m(r=>r+1);b.useEffect(()=>{f(r=>({...r,companyName:t.nameBn,companyAddress:t.addressBn,date:r.date||new Date().toISOString().split("T")[0]}))},[t.id]);const w=!!(c.name&&c.cardNo&&c.companyName),S=!!c.absenceStartDate,E=()=>{p(!1),f(r=>({...T,companyName:r.companyName,companyAddress:r.companyAddress,date:r.date||new Date().toISOString().split("T")[0]})),g("personal"),i.setEditingId(null),N()},G=()=>window.print(),J=async()=>{const r=n.current;r&&await ae({element:r,filename:`LeftNotice_${c.name||"document"}`,scale:2})},X=()=>({employeeName:c.name,cardNo:c.cardNo,designation:c.designation,department:c.section,fatherName:c.fatherName??"",motherName:c.motherName??"",gender:c.gender??"",husbandName:c.husbandName??"",date:c.date??"",joiningDate:c.joiningDate??"",absentFrom:c.absenceStartDate??"",firstNoticeDate:c.firstNoticeDate??"",secondNoticeDate:c.secondNoticeDate??"",thirdNoticeDate:c.thirdNoticeDate??"",noticeType:"notice1",addressesJson:JSON.stringify({present:c.presentAddress,permanent:c.permanentAddress})}),K=[{label:"পত্র নং-১",onClick:()=>S&&g("notice1")},{label:"পত্র নং-২",onClick:()=>S&&g("notice2")},{label:"পত্র নং-৩",onClick:()=>S&&g("notice3")},{label:"খাম",onClick:()=>{},subItems:[{label:"বর্তমান ঠিকানা",onClick:()=>S&&g("envelope-present"),active:o==="envelope-present"},{label:"স্থায়ী ঠিকানা",onClick:()=>S&&g("envelope-permanent"),active:o==="envelope-permanent"}]}],Z=o!=="personal"&&o!=="address",Q=o==="personal"||o==="address"?o:"personal";return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@700&display=swap');

        /* Force Noto Sans Bengali on ALL notice/envelope output */
        .print-content,
        .print-content *,
        .envelope-wrap,
        .envelope-wrap * {
          font-family: 'Noto Sans Bengali', 'Noto Sans', Arial, sans-serif !important;
          color: #000 !important;
          text-decoration: none !important;
        }
        /* Company name — unified with the app-wide font (was serif) */
        .company-name, .company-name * {
          font-family: 'Noto Sans Bengali', 'Segoe UI', system-ui, sans-serif !important;
        }

        ${$}${Y}

        @media print {
          @page { size: A4 portrait; margin: 25mm 20mm 20mm 25mm; }
          body { font-family: 'Noto Sans Bengali', Arial, sans-serif !important; }
          .print-content, .print-content * {
            font-family: 'Noto Sans Bengali', Arial, sans-serif !important;
            color: #000 !important;
          }
        }
      `}),e.jsxs(oe,{moduleName:"কর্মী অনুপস্থিতি নোটিশ",moduleNameEn:"Left Worker Notice",date:c.date,onDateChange:r=>f(h=>({...h,date:r})),steps:ve,activeStep:Q,onStepChange:r=>g(r),billItems:K,isBillActive:Z,onSave:async()=>{const r=X(),h=i.editingId?await i.update(i.editingId,r):await i.save(r);return h&&E(),h},isSaving:i.isSaving,configured:i.configured,adapterName:i.adapterName,saveDisabled:!w,editingId:i.editingId,onCancelEdit:E,isDirty:l,onReset:E,onUpdate:r=>{i.setEditingId(String(r.id??"")),f(h=>M(r,h)),g("personal"),N()},updateModule:"leftnotice",updateLabel:"Left Notice রেকর্ড খুঁজুন",updateSearchPlaceholder:"নাম, কার্ড নং বা পদবী দিয়ে খুঁজুন...",onEmployeeSelect:r=>{f(h=>({...h,name:String(r.fullNameBengali??r.fullName??h.name),fatherName:String(r.fatherName??h.fatherName),motherName:String(r.motherName??h.motherName??""),gender:ye(r.gender)||h.gender||"",husbandName:String(r.husbandName??h.husbandName??""),designation:String(r.designation??h.designation),cardNo:String(r.cardNo??h.cardNo),section:String(r.sectionLine??r.department??h.section),joiningDate:String(r.joiningDate??h.joiningDate??""),presentAddress:{houseNo:String(r.presentHouseNo??h.presentAddress.houseNo),village:String(r.presentVillage??h.presentAddress.village),postOffice:String(r.presentPostOffice??h.presentAddress.postOffice),thana:String(r.presentThana??h.presentAddress.thana),district:String(r.presentDistrict??h.presentAddress.district)},permanentAddress:{houseNo:String(r.permanentHouseNo??h.permanentAddress.houseNo),village:String(r.permanentVillage??h.permanentAddress.village),postOffice:String(r.permanentPostOffice??h.permanentAddress.postOffice),thana:String(r.permanentThana??h.permanentAddress.thana),district:String(r.permanentDistrict??h.permanentAddress.district)}})),p(!0),N()},calcRows:[{label:"১ম নোটিশ",value:c.firstNoticeDate?D(c.firstNoticeDate.split("-").reverse().join("/")):"—"},{label:"২য় নোটিশ",value:c.secondNoticeDate?D(c.secondNoticeDate.split("-").reverse().join("/")):"—"},{label:"চূড়ান্ত নোটিশ",value:c.thirdNoticeDate?D(c.thirdNoticeDate.split("-").reverse().join("/")):"—"}],records:i.records,isLoading:i.isLoading,onLoadRecord:r=>{i.setEditingId(String(r.id??"")),f(h=>M(r,h)),g("personal"),window.scrollTo({top:0,behavior:"smooth"}),N()},onDeleteRecord:i.remove,onReload:i.reload,auth:d,onAuthChange:s,onPrint:G,onPDF:J,lang:"bn",children:[(o==="personal"||o==="address")&&e.jsx(e.Fragment,{children:e.jsx(be,{employee:c,onChange:r=>{p(!0),f(r)},activeTab:o,onDirtyChange:r=>{r&&p(!0)}},`${i.editingId??"new"}-${y}`)}),(o==="envelope-present"||o==="envelope-permanent")&&e.jsx("div",{id:"printable-area",ref:n,children:e.jsx(Ne,{employee:c,addressType:o==="envelope-present"?"present":"permanent"})}),["notice1","notice2","notice3"].map((r,h)=>o===r&&e.jsx("div",{id:"printable-area",ref:n,children:e.jsx(je,{employee:c,title:`পত্র নং-${D(h+1)}`,noticeType:r,authorization:d})},r))]})]})}export{Ie as default};
