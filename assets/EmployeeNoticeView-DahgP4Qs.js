import{r as j,j as e,u as T,b as J,e as U}from"./index-BMk6AYuf.js";import{u as G}from"./useDatabase-BT8BSdeR.js";import{P as Z,D as K,M as Q,t as A}from"./ModuleShell-CQep6I87.js";import{t as S}from"./bnEnDate-DcYhykOO.js";import{u as L,a as W,c as k,b as z,g as X,F as x,I as u,C as w,S as ee,f as te,d as ne,o as E,s as f}from"./FormField-Ccyt3J6x.js";import{B as $,P as q}from"./printCSS-BDFSa_Tw.js";import"./DatabaseFactory-jcOeLksM.js";import"./AuthorityIconButton-vlYuhaVv.js";import"./DataUseCases-BTH_jVP6.js";const P={name:"",fatherName:"",motherName:"",gender:"",husbandName:"",designation:"",cardNo:"",section:"",date:"",joiningDate:"",absenceStartDate:"",firstNoticeDate:"",secondNoticeDate:"",thirdNoticeDate:"",companyName:"",companyAddress:"",presentAddress:{houseNo:"",village:"",postOffice:"",thana:"",district:""},permanentAddress:{houseNo:"",village:"",postOffice:"",thana:"",district:""}},v=t=>{if(!t)return"";const r=new Date(t),s=String(r.getDate()).padStart(2,"0"),n=String(r.getMonth()+1).padStart(2,"0"),c=r.getFullYear(),o=`${s}/${n}/${c}`;return S(o)},C=E({houseNo:f().default(""),village:f().min(1,"গ্রাম / মহল্লা আবশ্যক"),postOffice:f().default(""),thana:f().default(""),district:f().min(1,"জেলা আবশ্যক")}),ae=E({name:f().min(1,"কর্মীর নাম আবশ্যক"),fatherName:f().default(""),motherName:f().default(""),cardNo:f().min(1,"কার্ড নং আবশ্যক"),designation:f().min(1,"পদবী আবশ্যক"),section:f().default(""),gender:f().min(1,"লিঙ্গ নির্বাচন করুন").refine(t=>["male","female","third"].includes(t),"লিঙ্গ নির্বাচন করুন"),husbandName:f().default(""),joiningDate:f().default(""),absenceDay:f().min(1,"দিন আবশ্যক").refine(t=>Number(t)>=1&&Number(t)<=31,"১–৩১ এর মধ্যে হতে হবে"),absenceMonth:f().min(1,"মাস আবশ্যক").refine(t=>Number(t)>=1&&Number(t)<=12,"১–১২ এর মধ্যে হতে হবে"),absenceYear:f().min(4,"বছর আবশ্যক").refine(t=>Number(t)>=1990&&Number(t)<=2100,"সঠিক বছর দিন")}),re=E({presentAddress:C,permanentAddress:C}),se={"02-21":"Language Day","03-26":"Independence Day","04-14":"Pohela Boishakh","05-01":"May Day","08-15":"National Mourning Day","12-16":"Victory Day"},ie=t=>`${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`in se,oe=t=>t.getDay()===5||t.getDay()===6,B=(t,r)=>{if(!t)return"";const s=new Date(t);let n=0;for(;n<r;)s.setDate(s.getDate()+1),!oe(s)&&!ie(s)&&n++;return s.toISOString().split("T")[0]},I=(t,r,s)=>{if(!t||!r||!s||s.length<4)return"";const n=Number(t),c=Number(r),o=Number(s);if(isNaN(n)||isNaN(c)||isNaN(o)||n<1||n>31||c<1||c>12||o<1900)return"";const l=`${o}-${String(c).padStart(2,"0")}-${String(n).padStart(2,"0")}`;return isNaN(new Date(l).getTime())?"":l};function O({title:t,titleEn:r,icon:s,prefix:n,disabled:c,control:o,errors:l}){return e.jsxs("div",{role:"group","aria-labelledby":`${n}-legend`,style:{flex:1,minWidth:200},children:[e.jsxs("div",{id:`${n}-legend`,style:{...z,marginBottom:10,fontSize:14},children:[t,e.jsxs("span",{style:{fontSize:12,color:"#94A3B8",fontWeight:400},children:["(",r,")"]})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12},children:[e.jsx(w,{name:`${n}.houseNo`,control:o,render:({field:m})=>e.jsx("div",{style:{gridColumn:"1 / -1"},children:e.jsx(x,{label:"বাড়ি / বাড়ি নং / রাস্তা",id:`${n}-houseNo`,children:e.jsx(u,{id:`${n}-houseNo`,...m,disabled:c,placeholder:"বাড়ি নং বা রাস্তার নাম"})})})}),e.jsx(w,{name:`${n}.village`,control:o,render:({field:m,fieldState:d})=>e.jsx(x,{label:"গ্রাম / মহল্লা",id:`${n}-village`,required:!0,error:d.error?.message,children:e.jsx(u,{id:`${n}-village`,...m,disabled:c,placeholder:"গ্রাম বা মহল্লা","aria-required":!0,"aria-invalid":!!d.error,"aria-describedby":d.error?`${n}-village-err`:void 0,error:!!d.error})})}),e.jsx(w,{name:`${n}.postOffice`,control:o,render:({field:m})=>e.jsx(x,{label:"ডাকঘর",id:`${n}-po`,children:e.jsx(u,{id:`${n}-po`,...m,disabled:c,placeholder:"ডাকঘরের নাম"})})}),e.jsx(w,{name:`${n}.thana`,control:o,render:({field:m})=>e.jsx(x,{label:"থানা",id:`${n}-thana`,children:e.jsx(u,{id:`${n}-thana`,...m,disabled:c,placeholder:"থানার নাম"})})}),e.jsx(w,{name:`${n}.district`,control:o,render:({field:m,fieldState:d})=>e.jsx(x,{label:"জেলা",id:`${n}-district`,required:!0,error:d.error?.message,children:e.jsx(u,{id:`${n}-district`,...m,disabled:c,placeholder:"জেলার নাম","aria-required":!0,"aria-invalid":!!d.error,error:!!d.error})})})]})]})}function de({employee:t,onChange:r,onDirtyChange:s}){const{register:n,control:c,watch:o,formState:{errors:l,isDirty:m},trigger:d}=L({resolver:W(ae),mode:"onBlur",defaultValues:{name:t.name||"",fatherName:t.fatherName||"",motherName:t.motherName||"",cardNo:t.cardNo||"",designation:t.designation||"",section:t.section||"",gender:t.gender||"",husbandName:t.husbandName||"",joiningDate:t.joiningDate||"",absenceDay:t.absenceStartDate?.split("-")[2]||"",absenceMonth:t.absenceStartDate?.split("-")[1]||"",absenceYear:t.absenceStartDate?.split("-")[0]||""}}),g=o("gender"),i=o("absenceDay"),b=o("absenceMonth"),D=o("absenceYear");return j.useEffect(()=>{s?.(m)},[m,s]),j.useEffect(()=>{const h=I(i,b,D),N=h?B(h,10):"",y=N?B(N,10):"",F=y?B(y,7):"";r({...t,name:o("name"),fatherName:o("fatherName"),motherName:o("motherName"),cardNo:o("cardNo"),designation:o("designation"),section:o("section"),gender:o("gender"),husbandName:o("husbandName"),joiningDate:o("joiningDate"),absenceStartDate:h,firstNoticeDate:N,secondNoticeDate:y,thirdNoticeDate:F})},[i,b,D,g]),I(i,b,D),e.jsxs("div",{style:{paddingBottom:16},children:[e.jsxs("div",{style:k,children:[e.jsxs("div",{style:z,children:["সাধারণ তথ্য",e.jsx("span",{style:{fontSize:12,color:"#94A3B8",fontWeight:400},children:"Personal info"})]}),e.jsxs("div",{style:X,children:[e.jsx(x,{label:"কর্মীর নাম",required:!0,id:"pf-name",error:l.name?.message,children:e.jsx(u,{id:"pf-name",placeholder:"যেমন: রাহেলা বেগম","aria-required":!0,"aria-invalid":!!l.name,"aria-describedby":l.name?"pf-name-err":void 0,error:!!l.name,...n("name",{onChange:h=>r({...t,name:h.target.value})})})}),e.jsx(x,{label:"পিতার নাম",id:"pf-father",children:e.jsx(u,{id:"pf-father",placeholder:"পিতার নাম",...n("fatherName",{onChange:h=>r({...t,fatherName:h.target.value})})})}),e.jsx(x,{label:"মাতার নাম",id:"pf-mother",children:e.jsx(u,{id:"pf-mother",placeholder:"মাতার নাম",...n("motherName",{onChange:h=>r({...t,motherName:h.target.value})})})}),e.jsx(x,{label:"কার্ড নং",required:!0,id:"pf-card",error:l.cardNo?.message,children:e.jsx(u,{id:"pf-card",placeholder:"যেমন: EMP-0042","aria-required":!0,"aria-invalid":!!l.cardNo,error:!!l.cardNo,...n("cardNo",{onChange:h=>r({...t,cardNo:h.target.value})})})}),e.jsx(x,{label:"পদবী",required:!0,id:"pf-desg",error:l.designation?.message,children:e.jsx(u,{id:"pf-desg",placeholder:"যেমন: অপারেটর","aria-required":!0,"aria-invalid":!!l.designation,error:!!l.designation,...n("designation",{onChange:h=>r({...t,designation:h.target.value})})})}),e.jsx(x,{label:"সেকশন",id:"pf-section",children:e.jsx(u,{id:"pf-section",placeholder:"যেমন: সুইং",...n("section",{onChange:h=>r({...t,section:h.target.value})})})}),e.jsx(x,{label:"লিঙ্গ",required:!0,id:"pf-gender",error:l.gender?.message,children:e.jsx(w,{name:"gender",control:c,render:({field:h,fieldState:N})=>e.jsx(ee,{id:"pf-gender",value:h.value??"","aria-required":!0,"aria-invalid":!!N.error,error:!!N.error,placeholder:"লিঙ্গ নির্বাচন করুন",options:[{value:"male",label:"পুরুষ (Male)"},{value:"female",label:"নারী (Female)"},{value:"third",label:"অ-দ্বৈত / তৃতীয় লিঙ্গ"}],onChange:y=>{h.onChange(y),r({...t,gender:y.target.value})},onBlur:h.onBlur})})}),g==="female"&&e.jsx(x,{label:"স্বামীর নাম",id:"pf-husband",children:e.jsx(u,{id:"pf-husband",placeholder:"স্বামীর নাম",...n("husbandName",{onChange:h=>r({...t,husbandName:h.target.value})})})}),e.jsx(x,{label:"যোগদানের তারিখ",id:"pf-join",children:e.jsx(u,{id:"pf-join",type:"date",...n("joiningDate",{onChange:h=>r({...t,joiningDate:h.target.value})})})})]})]}),e.jsxs("div",{style:k,children:[e.jsxs("div",{style:z,children:["অনুপস্থিতির তারিখ",e.jsx("span",{style:{fontSize:12,color:"#94A3B8",fontWeight:400},children:"Absence start date"})]}),e.jsxs("fieldset",{style:{border:"none",padding:0},children:[e.jsx("legend",{style:{fontSize:12,color:"#64748B",marginBottom:10,fontFamily:te},children:"দিন, মাস ও বছর আলাদাভাবে লিখুন"}),e.jsxs("div",{style:{display:"flex",gap:12,alignItems:"flex-start"},children:[e.jsx(x,{label:"দিন",id:"pf-abs-day",hint:"১–৩১",error:l.absenceDay?.message,children:e.jsx(u,{id:"pf-abs-day",type:"number",min:1,max:31,placeholder:"দিন",style:{textAlign:"center"},"aria-required":!0,"aria-invalid":!!l.absenceDay,error:!!l.absenceDay,...n("absenceDay",{onBlur:()=>d(["absenceDay","absenceMonth","absenceYear"])})})}),e.jsx(x,{label:"মাস",id:"pf-abs-month",hint:"১–১২",error:l.absenceMonth?.message,children:e.jsx(u,{id:"pf-abs-month",type:"number",min:1,max:12,placeholder:"মাস",style:{textAlign:"center"},"aria-required":!0,"aria-invalid":!!l.absenceMonth,error:!!l.absenceMonth,...n("absenceMonth",{onBlur:()=>d(["absenceDay","absenceMonth","absenceYear"])})})}),e.jsx(x,{label:"বছর",id:"pf-abs-year",hint:"যেমন: ২০২৬",error:l.absenceYear?.message,children:e.jsx(u,{id:"pf-abs-year",type:"number",min:1990,max:2100,placeholder:"বছর","aria-required":!0,"aria-invalid":!!l.absenceYear,error:!!l.absenceYear,...n("absenceYear",{onBlur:()=>d(["absenceDay","absenceMonth","absenceYear"])})})})]})]})]})]})}function le({employee:t,onChange:r,onDirtyChange:s}){const[n,c]=j.useState(!1),{control:o,watch:l,setValue:m,formState:{isDirty:d}}=L({resolver:W(re),mode:"onBlur",defaultValues:{presentAddress:{...t.presentAddress,houseNo:t.presentAddress.houseNo||""},permanentAddress:{...t.permanentAddress,houseNo:t.permanentAddress.houseNo||""}}});j.useEffect(()=>{s?.(d)},[d,s]);const g=l("presentAddress");j.useEffect(()=>{n&&(m("permanentAddress",{...g},{shouldDirty:!0}),r({...t,permanentAddress:{...g}}))},[g,n]);const i=l("presentAddress"),b=l("permanentAddress");return j.useEffect(()=>{r({...t,presentAddress:i,permanentAddress:b})},[i,b]),e.jsx("div",{style:{paddingBottom:16},children:e.jsxs("div",{style:k,children:[e.jsxs("div",{style:{...z,justifyContent:"space-between",marginBottom:14},children:[e.jsxs("span",{style:{display:"flex",alignItems:"center",gap:8},children:["ঠিকানা",e.jsx("span",{style:{fontSize:12,color:"#94A3B8",fontWeight:400},children:"(Addresses)"})]}),e.jsx(ne,{id:"addr-same",label:"উভয় ঠিকানা একই",hint:"টিক করলে স্থায়ী ঠিকানা স্বয়ংক্রিয়ভাবে পূরণ হবে",checked:n,onChange:D=>{c(D),D&&(m("permanentAddress",{...g},{shouldDirty:!0}),r({...t,permanentAddress:{...g}}))}})]}),e.jsxs("div",{style:{display:"flex",gap:16,flexWrap:"wrap"},children:[e.jsx("div",{style:{flex:1,minWidth:200,border:"1px solid #BFDBFE",borderRadius:10,padding:"14px 16px",background:"#FAFEFF"},children:e.jsx(O,{title:"বর্তমান ঠিকানা",titleEn:"Present address",icon:"ti-map-pin",prefix:"presentAddress",disabled:!1,control:o,errors:{}})}),e.jsx("div",{style:{display:"flex",alignItems:"center",color:"#CBD5E1",fontSize:20,userSelect:"none"},"aria-hidden":"true",children:n?"=":"≠"}),e.jsx("div",{style:{flex:1,minWidth:200,border:`1px solid ${n?"#E2E8F0":"#86EFAC"}`,borderRadius:10,padding:"14px 16px",background:n?"#F8FAFC":"#F0FDF4",opacity:n?.6:1,transition:"opacity .2s, border-color .2s"},children:e.jsx(O,{title:"স্থায়ী ঠিকানা",titleEn:"Permanent address",icon:"ti-home",prefix:"permanentAddress",disabled:n,control:o,errors:{}})})]})]})})}const ce=({employee:t,onChange:r,activeTab:s="personal",onDirtyChange:n})=>{const c=j.useCallback(o=>n?.(o),[n]);return s==="personal"?e.jsx(de,{employee:t,onChange:r,onDirtyChange:c}):e.jsx(le,{employee:t,onChange:r,onDirtyChange:c})},pe=({employee:t,title:r,content:s,authorization:n,noticeType:c})=>{const o=["শ্রমিকের ব্যক্তিগত নথি।","সংশ্লিষ্ট ব্যক্তি।"],m=(()=>{switch(c){case"notice1":return{absenceDate:v(t.absenceStartDate||""),noticeDate:v(t.firstNoticeDate||"")};case"notice2":return{absenceDate:v(t.absenceStartDate||""),firstNoticeDate:v(t.firstNoticeDate||""),noticeDate:v(t.secondNoticeDate||"")};case"notice3":return{absenceDate:v(t.absenceStartDate||""),firstNoticeDate:v(t.firstNoticeDate||""),secondNoticeDate:v(t.secondNoticeDate||""),noticeDate:v(t.thirdNoticeDate||"")};default:return{}}})(),d=()=>{if(s)return s;switch(c){case"notice1":return e.jsxs(e.Fragment,{children:[e.jsx("p",{className:"nl-subject",children:"বিষয় : বাংলাদেশ শ্রম আইন ২০০৬ এর ২৭ (৩ক) ধারা মোতাবেক ব্যাখ্যা প্রদান সহ চাকুরীতে যোগদানের জন্য নোটিশ।"}),e.jsx("p",{className:"nl-salute",children:"জনাব/জনাবা,"}),e.jsxs("p",{className:"nl-para",children:["আপনি গত ",e.jsx("u",{children:e.jsx("strong",{children:m.absenceDate})})," ইং তারিখ থেকে কারখানা কর্তৃপক্ষের বিনা অনুমতিতে কর্মস্থলে অনুপস্থিত রয়েছেন। আপনার এরূপ অনুপস্থিতি বাংলাদেশ শ্রম আইন ২০০৬ এর ২৭ (৩ক) ধারার আওতায় পড়ে।"]}),e.jsx("p",{className:"nl-para",children:"সুতরাং অত্র পত্র প্রাপ্তির ১০ (দশ) দিনের মধ্যে আপনার অনুপস্থিতির কারণ ব্যাখ্যা সহ কাজে যোগদানের জন্য আপনাকে নির্দেশ দেয়া হলো।"}),e.jsx("p",{className:"nl-para",children:"আপনার লিখিত জবাব উক্ত সময়ের মধ্যে নিম্নস্বাক্ষরকারীর নিকট অবশ্যই পৌঁছাতে হবে। অন্যথায় কর্তৃপক্ষ আপনার বিরুদ্ধে প্রয়োজনীয় আইনানুগ ব্যবস্থা নিতে বাধ্য হবে।"})]});case"notice2":return e.jsxs(e.Fragment,{children:[e.jsx("p",{className:"nl-subject",children:"বিষয় : বাংলাদেশ শ্রম আইন ২০০৬ এর ২৭ (৩ক) ধারা মোতাবেক আত্মপক্ষ সমর্থনের সুযোগ প্রদান প্রসঙ্গে।"}),e.jsx("p",{className:"nl-salute",children:"জনাব/জনাবা,"}),e.jsxs("p",{className:"nl-para",children:["আপনি গত ",e.jsx("u",{children:e.jsx("strong",{children:m.absenceDate})})," ইং তারিখ থেকে কারখানা কর্তৃপক্ষের বিনা অনুমতিতে কর্মস্থলে অনুপস্থিত রয়েছেন। এ প্রেক্ষিতে কারখানা কর্তৃপক্ষ আপনার স্থায়ী ও বর্তমান ঠিকানায় রেজিস্ট্রি ডাকযোগে গত ",e.jsx("u",{children:e.jsx("strong",{children:m.firstNoticeDate})})," ইং তারিখে বিনানুমতিতে চাকুরীতে অনুপস্থিতির কারণ ব্যাখ্যা সহ কাজে যোগদানের জন্য পত্র প্রেরণ করা হয়। কিন্তু অদ্যবধি আপনি উপরোক্ত বিষয়ে কোন ধরণের লিখিত ব্যাখ্যা প্রদান করেন নাই অথবা চাকুরীতেও যোগদান করেন নাই।"]}),e.jsx("p",{className:"nl-para",children:"অতএব, অত্র পত্র প্রাপ্তির ০৭ (সাত) দিনের মধ্যে আত্মপক্ষ সমর্থন সহ কাজে যোগদান করিতে আপনাকে নির্দেশ দেয়া গেল।"}),e.jsx("p",{className:"nl-para",children:"উক্ত সময়ের মধ্যে আপনি আত্মপক্ষ সমর্থনের জবাব সহ কাজে যোগদান করতে ব্যর্থ হলে বাংলাদেশ শ্রম আইন ২০০৬ এর ২৭ (৩ক) ধারা অনুযায়ী আপনি স্বেচ্ছায় চাকুরী থেকে ইস্তফা গ্রহণ করেছেন বলে গণ্য হবে।"})]});case"notice3":return e.jsxs(e.Fragment,{children:[e.jsx("p",{className:"nl-subject",children:"বিষয় : বাংলাদেশ শ্রম আইন ২০০৬ এর ২৭ (৩ক) ধারা মোতাবেক শ্রমিক কর্তৃক স্বেচ্ছায় চাকুরী হইতে ইস্তফা প্রসঙ্গে।"}),e.jsx("p",{className:"nl-salute",children:"জনাব/জনাবা,"}),e.jsxs("p",{className:"nl-para",children:["আপনি গত ",e.jsx("u",{children:e.jsx("strong",{children:m.absenceDate})})," ইং তারিখ হতে অদ্যবধি পর্যন্ত কর্তৃপক্ষের বিনা অনুমতিতে কর্মস্থলে অনুপস্থিত থাকার আপনাকে গত ",e.jsx("u",{children:e.jsx("strong",{children:m.firstNoticeDate})})," ইং তারিখে একটি পত্রের মাধ্যমে ১০ (দশ) দিনের সময় দিয়ে চাকুরীতে যোগদান সহ ব্যাখ্যা প্রদান করতে বলা হয়েছিল। কিন্তু আপনি নির্ধারিত সময়ের মধ্যে কর্মস্থলে উপস্থিত হননি এবং কোন ব্যাখ্যা প্রদান করেননি।"]}),e.jsxs("p",{className:"nl-para",children:["তথাপি কর্তৃপক্ষ গত ",e.jsx("u",{children:e.jsx("strong",{children:m.secondNoticeDate})})," ইং তারিখে আর একটি পত্রের মাধ্যমে আপনাকে আরো ৭ (সাত) দিনের সময় দিয়ে আত্মপক্ষ সমর্থন সহ চাকুরীতে যোগদানের জন্য পুনরায় নির্দেশ প্রদান করেন। তৎসত্ত্বেও আপনি নির্ধারিত সময়ের মধ্যে আত্মপক্ষ করেননি এবং যোগদান করেননি।"]}),e.jsx("p",{className:"nl-para",children:"সুতরাং বাংলাদেশ শ্রম আইন, ২০০৬ এর ২৭ (৩ক) ধারা অনুযায়ী অনুপস্থিত দিন থেকে আপনি চাকুরী হতে স্বেচ্ছায় ইস্তফা গ্রহণ করেছেন বলে গণ্য করা হলো।"}),e.jsx("p",{className:"nl-para",children:"অতএব, আপনার বকেয়া মজুরী ও আইনানুগ পাওনা (যদি থাকে) যে কোন কর্মদিবসে অফিস চলাকালীন সময়ে কারখানার হিসাব শাখা থেকে গ্রহণ করার জন্য নির্দেশ দেয়া গেল।"})]});default:return null}};return e.jsxs("div",{className:"nl-page",children:[e.jsxs("div",{className:"nl-wrap",children:[e.jsxs("div",{className:"nl-header",children:[t.companyName&&e.jsx("h1",{className:"nl-co-name",children:t.companyName}),t.companyAddress&&e.jsx("p",{className:"nl-co-addr",children:t.companyAddress})]}),e.jsxs("div",{className:"nl-title-bar",children:[e.jsx("h2",{className:"nl-title",children:'"রেজিস্টার্ড ডাকযোগে প্রেরিত"'}),m.noticeDate&&e.jsxs("div",{className:"nl-meta",children:[e.jsxs("span",{className:"nl-meta-type",children:["(",r,")"]}),e.jsxs("span",{className:"nl-meta-date",children:["তারিখ : ",e.jsxs("strong",{children:[S(m.noticeDate)," ইং"]})]})]})]}),e.jsx("p",{className:"nl-to",children:"প্রতি,"}),e.jsxs("div",{className:"nl-emp-box",children:[e.jsxs("div",{className:"nl-emp-col",children:[e.jsx("div",{className:"nl-emp-head",children:"ব্যক্তিগত তথ্য"}),e.jsx("table",{className:"nl-emp-tbl",children:e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:"নাম"}),e.jsx("td",{children:t.name||"—"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"পিতার নাম"}),e.jsx("td",{children:t.fatherName||"—"})]}),t.motherName&&e.jsxs("tr",{children:[e.jsx("td",{children:"মাতার নাম"}),e.jsx("td",{children:t.motherName})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"পদবী"}),e.jsx("td",{children:t.designation||"—"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"কার্ড নং"}),e.jsx("td",{children:t.cardNo||"—"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"সেকশন"}),e.jsx("td",{children:t.section||"—"})]}),t.joiningDate&&e.jsxs("tr",{children:[e.jsx("td",{children:"যোগদান"}),e.jsx("td",{children:v(t.joiningDate)})]})]})})]}),e.jsx("div",{className:"nl-emp-divider"}),e.jsxs("div",{className:"nl-emp-col",children:[e.jsx("div",{className:"nl-emp-head",children:"বর্তমান ঠিকানা"}),e.jsx("table",{className:"nl-emp-tbl",children:e.jsxs("tbody",{children:[t.presentAddress.houseNo&&e.jsxs("tr",{children:[e.jsx("td",{children:"বাড়ি"}),e.jsx("td",{children:t.presentAddress.houseNo})]}),t.presentAddress.village&&e.jsxs("tr",{children:[e.jsx("td",{children:"গ্রাম"}),e.jsx("td",{children:t.presentAddress.village})]}),t.presentAddress.postOffice&&e.jsxs("tr",{children:[e.jsx("td",{children:"ডাকঘর"}),e.jsx("td",{children:t.presentAddress.postOffice})]}),t.presentAddress.thana&&e.jsxs("tr",{children:[e.jsx("td",{children:"থানা"}),e.jsx("td",{children:t.presentAddress.thana})]}),t.presentAddress.district&&e.jsxs("tr",{children:[e.jsx("td",{children:"জেলা"}),e.jsx("td",{children:t.presentAddress.district})]})]})})]}),e.jsx("div",{className:"nl-emp-divider"}),e.jsxs("div",{className:"nl-emp-col",children:[e.jsx("div",{className:"nl-emp-head",children:"স্থায়ী ঠিকানা"}),e.jsx("table",{className:"nl-emp-tbl",children:e.jsxs("tbody",{children:[t.permanentAddress.houseNo&&e.jsxs("tr",{children:[e.jsx("td",{children:"বাড়ি"}),e.jsx("td",{children:t.permanentAddress.houseNo})]}),t.permanentAddress.village&&e.jsxs("tr",{children:[e.jsx("td",{children:"গ্রাম"}),e.jsx("td",{children:t.permanentAddress.village})]}),t.permanentAddress.postOffice&&e.jsxs("tr",{children:[e.jsx("td",{children:"ডাকঘর"}),e.jsx("td",{children:t.permanentAddress.postOffice})]}),t.permanentAddress.thana&&e.jsxs("tr",{children:[e.jsx("td",{children:"থানা"}),e.jsx("td",{children:t.permanentAddress.thana})]}),t.permanentAddress.district&&e.jsxs("tr",{children:[e.jsx("td",{children:"জেলা"}),e.jsx("td",{children:t.permanentAddress.district})]})]})})]})]}),e.jsx("div",{className:"nl-body",children:d()}),c&&e.jsxs("div",{className:"nl-copy",children:[e.jsx("p",{children:e.jsx("strong",{children:e.jsx("u",{children:"অনুলিপি :"})})}),e.jsx("ol",{children:o.map((g,i)=>e.jsxs("li",{children:[e.jsxs("span",{children:[S(String(i+1)),"."]}),g]},i))})]}),c&&e.jsxs("div",{className:"nl-footer",children:[e.jsx("p",{className:"nl-authority",children:"কর্তৃপক্ষের নির্দেশক্রমে"}),n&&e.jsx(Z,{value:n,lang:"bn",hidePrepared:!0,hideTopBorder:!0})]})]}),e.jsx("style",{children:`
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
      `})]})};function M({employee:t,address:r,addressLabel:s}){const n=T(),c=[r.houseNo,r.village,r.postOffice,r.thana,r.district].filter(Boolean).join(", ");return e.jsx("div",{className:"envelope-container",children:e.jsxs("div",{className:"envelope",children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start"},children:[e.jsxs("div",{style:{maxWidth:"55%"},children:[e.jsx("p",{style:{fontSize:"8pt",fontWeight:700,color:"#111827",margin:0,textDecoration:"underline"},children:"From"}),e.jsx("p",{style:{fontSize:"9pt",fontWeight:700,color:"#111827",margin:"3pt 0 0"},children:t.companyName||n.nameEn}),e.jsx("p",{style:{fontSize:"8pt",color:"#374151",margin:"1pt 0 0",lineHeight:1.35},children:t.companyAddress||"32, Lakshmipura, Chandana, Joydevpur, Gazipur-1700"})]}),e.jsx("div",{style:{width:"32mm",height:"18mm",flexShrink:0,border:"1px dashed #9ca3af",borderRadius:"2px",display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx("span",{style:{fontSize:"6.5pt",color:"#9ca3af"},children:"Postage / Stamp"})})]}),e.jsxs("div",{style:{marginTop:"14mm"},children:[e.jsx("p",{style:{fontSize:"10pt",fontWeight:700,color:"#111827",margin:0},children:"To"}),e.jsx("p",{style:{fontSize:"9pt",fontWeight:700,color:"#111827",margin:"5pt 0 3pt",textDecoration:"underline"},children:s}),e.jsx("p",{style:{fontSize:"11pt",fontWeight:700,color:"#111827",margin:"4pt 0 0"},children:t.name||"Employee Name"}),(t.fatherName||t.husbandName)&&e.jsx("p",{style:{fontSize:"8.5pt",color:"#1f2937",margin:"2pt 0 0"},children:t.fatherName?`son/daughter of ${t.fatherName}`:`wife of ${t.husbandName}`}),c&&e.jsx("p",{style:{fontSize:"9.5pt",color:"#1f2937",margin:"4pt 0 0",lineHeight:1.6,maxWidth:"85%"},children:c})]})]})})}const me=({employee:t,addressType:r="both"})=>{const s=r==="present"||r==="both",n=r==="permanent"||r==="both";return e.jsxs("div",{className:"envelope-page",children:[s&&e.jsx(M,{employee:t,address:t.presentAddress,addressLabel:"বর্তমান ঠিকানা (Present Address)"}),n&&e.jsx(M,{employee:t,address:t.permanentAddress,addressLabel:"স্থায়ী ঠিকানা (Permanent Address)"}),e.jsx("style",{children:`
        ${$}
        ${q}

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
          /* ModuleShell's root container (and other ancestors) carry
             overflow:hidden as an inline style which clips its rendered
             content box regardless of child positioning. Since this is a
             shared component we can't edit, force every ancestor to
             overflow:visible in print so our position:absolute envelope
             page isn't clipped to a tiny visible region. */
          html, body, body * {
            overflow: visible !important;
          }

          html, body { width: 210mm; height: auto; }
          .envelope-page {
            position: absolute;
            top: 0;
            left: 0;
            display: block;
            width: 210mm;
            padding: 0;
            gap: 0;
            overflow: visible;
          }
          .envelope-container {
            width: 220mm;
            margin: 35mm auto 0;
            page-break-after: always;
            page-break-inside: avoid;
          }
          .envelope-container:last-child { page-break-after: avoid; }
          .envelope {
            box-shadow: none;
            border: 1px solid #000;
          }
        }
      `})]})},he=[{id:"personal",label:"সাধারণ তথ্য",icon:"ti-user-circle"},{id:"address",label:"ঠিকানা",icon:"ti-map-pin"}];function R(t,r){let s={};try{s=JSON.parse(String(t.addressesJson??"{}"))??{}}catch{}return{...r,name:String(t.employeeName??""),fatherName:String(t.fatherName??""),motherName:String(t.motherName??""),gender:String(t.gender??""),husbandName:String(t.husbandName??""),cardNo:String(t.cardNo??""),designation:String(t.designation??""),section:String(t.department??""),date:A(t.date),joiningDate:A(t.joiningDate),absenceStartDate:A(t.absentFrom),firstNoticeDate:A(t.firstNoticeDate),secondNoticeDate:A(t.secondNoticeDate),thirdNoticeDate:A(t.thirdNoticeDate),presentAddress:s.present??r.presentAddress,permanentAddress:s.permanent??r.permanentAddress}}function ye(){const t=T(),{user:r}=J(),s=G("leftnotice",t.id,r?.name??"unknown"),n=j.useRef(null),[c,o]=j.useState(K),[l,m]=j.useState(!1),[d,g]=j.useState("personal"),[i,b]=j.useState(P);j.useEffect(()=>{b(a=>({...a,companyName:t.nameBn,companyAddress:t.addressBn,date:a.date||new Date().toISOString().split("T")[0]}))},[t.id]);const D=!!(i.name&&i.cardNo&&i.companyName),h=!!i.absenceStartDate,N=()=>{m(!1),b(a=>({...P,companyName:a.companyName,companyAddress:a.companyAddress})),g("personal"),s.setEditingId(null)},y=()=>window.print(),F=async()=>{const a=n.current;a&&await U({element:a,filename:`LeftNotice_${i.name||"document"}`,scale:2})},V=()=>({employeeName:i.name,cardNo:i.cardNo,designation:i.designation,department:i.section,fatherName:i.fatherName??"",motherName:i.motherName??"",gender:i.gender??"",husbandName:i.husbandName??"",date:i.date??"",joiningDate:i.joiningDate??"",absentFrom:i.absenceStartDate??"",firstNoticeDate:i.firstNoticeDate??"",secondNoticeDate:i.secondNoticeDate??"",thirdNoticeDate:i.thirdNoticeDate??"",noticeType:"notice1",addressesJson:JSON.stringify({present:i.presentAddress,permanent:i.permanentAddress})}),Y=[{label:"পত্র নং-১",onClick:()=>h&&g("notice1")},{label:"পত্র নং-২",onClick:()=>h&&g("notice2")},{label:"পত্র নং-৩",onClick:()=>h&&g("notice3")},{label:"খাম",onClick:()=>{},subItems:[{label:"বর্তমান ঠিকানা",onClick:()=>h&&g("envelope-present"),active:d==="envelope-present"},{label:"স্থায়ী ঠিকানা",onClick:()=>h&&g("envelope-permanent"),active:d==="envelope-permanent"}]}],H=d!=="personal"&&d!=="address",_=d==="personal"||d==="address"?d:"personal";return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`
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

        ${$}${q}

        @media print {
          @page { size: A4 portrait; margin: 25mm 20mm 20mm 25mm; }
          body { font-family: 'Noto Sans Bengali', Arial, sans-serif !important; }
          .print-content, .print-content * {
            font-family: 'Noto Sans Bengali', Arial, sans-serif !important;
            color: #000 !important;
          }
        }
      `}),e.jsxs(Q,{moduleName:"কর্মী অনুপস্থিতি নোটিশ",moduleNameEn:"Left Worker Notice",date:i.date,onDateChange:a=>b(p=>({...p,date:a})),steps:he,activeStep:_,onStepChange:a=>g(a),billItems:Y,isBillActive:H,onSave:async()=>{const a=V(),p=s.editingId?await s.update(s.editingId,a):await s.save(a);return p&&N(),p},isSaving:s.isSaving,configured:s.configured,adapterName:s.adapterName,saveDisabled:!D,editingId:s.editingId,onCancelEdit:N,isDirty:l,onReset:N,onUpdate:a=>{s.setEditingId(String(a.id??"")),b(p=>R(a,p)),g("personal")},updateModule:"leftnotice",updateLabel:"Left Notice রেকর্ড খুঁজুন",updateSearchPlaceholder:"নাম, কার্ড নং বা পদবী দিয়ে খুঁজুন...",onEmployeeSelect:a=>{b(p=>({...p,name:String(a.fullNameBengali??a.fullName??p.name),fatherName:String(a.fatherName??p.fatherName),motherName:String(a.motherName??p.motherName??""),gender:String(a.gender??p.gender??""),designation:String(a.designation??p.designation),cardNo:String(a.cardNo??p.cardNo),section:String(a.sectionLine??a.department??p.section),joiningDate:String(a.joiningDate??p.joiningDate??""),presentAddress:{houseNo:String(a.presentHouseNo??p.presentAddress.houseNo),village:String(a.presentVillage??p.presentAddress.village),postOffice:String(a.presentPostOffice??p.presentAddress.postOffice),thana:String(a.presentThana??p.presentAddress.thana),district:String(a.presentDistrict??p.presentAddress.district)},permanentAddress:{houseNo:String(a.permanentHouseNo??p.permanentAddress.houseNo),village:String(a.permanentVillage??p.permanentAddress.village),postOffice:String(a.permanentPostOffice??p.permanentAddress.postOffice),thana:String(a.permanentThana??p.permanentAddress.thana),district:String(a.permanentDistrict??p.permanentAddress.district)}})),m(!0)},calcRows:[{label:"১ম নোটিশ",value:i.firstNoticeDate?S(i.firstNoticeDate.split("-").reverse().join("/")):"—"},{label:"২য় নোটিশ",value:i.secondNoticeDate?S(i.secondNoticeDate.split("-").reverse().join("/")):"—"},{label:"চূড়ান্ত নোটিশ",value:i.thirdNoticeDate?S(i.thirdNoticeDate.split("-").reverse().join("/")):"—"}],records:s.records,isLoading:s.isLoading,onLoadRecord:a=>{s.setEditingId(String(a.id??"")),b(p=>R(a,p)),g("personal"),window.scrollTo({top:0,behavior:"smooth"})},onDeleteRecord:s.remove,onReload:s.reload,auth:c,onAuthChange:o,onPrint:y,onPDF:F,lang:"bn",children:[(d==="personal"||d==="address")&&e.jsx(e.Fragment,{children:e.jsx(ce,{employee:i,onChange:a=>{m(!0),b(a)},activeTab:d,onDirtyChange:a=>{a&&m(!0)}},s.editingId??"new")}),(d==="envelope-present"||d==="envelope-permanent")&&e.jsx("div",{id:"printable-area",ref:n,children:e.jsx(me,{employee:i,addressType:d==="envelope-present"?"present":"permanent"})}),["notice1","notice2","notice3"].map((a,p)=>d===a&&e.jsx("div",{id:"printable-area",ref:n,children:e.jsx(pe,{employee:i,title:`পত্র নং-${S(p+1)}`,noticeType:a,authorization:c})},a))]})]})}export{ye as default};
