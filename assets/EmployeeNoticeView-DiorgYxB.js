import{r as u,j as e,u as T,b as _,e as J}from"./index-Dwkf-7if.js";import{B as $,P as L,u as U}from"./printCSS-eWJ_dEqr.js";import{P as G,D as Z,M as K,t as w}from"./ModuleShell-BpaZjK65.js";import{t as y}from"./bnEnDate-DcYhykOO.js";import{u as W,a as q,c as k,b as F,g as Q,F as g,I as f,C as z,S as X,f as ee,d as te,o as P,s as x}from"./FormField-BIBHl5PS.js";import"./DatabaseFactory-B6xot3db.js";import"./AuthorityIconButton-DMDfdAZx.js";import"./DataUseCases-CcyAYNW2.js";const C={name:"",fatherName:"",motherName:"",gender:"",husbandName:"",designation:"",cardNo:"",section:"",date:"",joiningDate:"",absenceStartDate:"",firstNoticeDate:"",secondNoticeDate:"",thirdNoticeDate:"",companyName:"",companyAddress:"",presentAddress:{houseNo:"",village:"",postOffice:"",thana:"",district:""},permanentAddress:{houseNo:"",village:"",postOffice:"",thana:"",district:""}},v=t=>{if(!t)return"";const r=new Date(t),s=String(r.getDate()).padStart(2,"0"),n=String(r.getMonth()+1).padStart(2,"0"),l=r.getFullYear(),d=`${s}/${n}/${l}`;return y(d)},I=P({houseNo:x().default(""),village:x().min(1,"গ্রাম / মহল্লা আবশ্যক"),postOffice:x().default(""),thana:x().default(""),district:x().min(1,"জেলা আবশ্যক")}),ne=P({name:x().min(1,"কর্মীর নাম আবশ্যক"),fatherName:x().default(""),motherName:x().default(""),cardNo:x().min(1,"কার্ড নং আবশ্যক"),designation:x().min(1,"পদবী আবশ্যক"),section:x().default(""),gender:x().min(1,"লিঙ্গ নির্বাচন করুন").refine(t=>["male","female","third"].includes(t),"লিঙ্গ নির্বাচন করুন"),husbandName:x().default(""),joiningDate:x().default(""),absenceDay:x().min(1,"দিন আবশ্যক").refine(t=>Number(t)>=1&&Number(t)<=31,"১–৩১ এর মধ্যে হতে হবে"),absenceMonth:x().min(1,"মাস আবশ্যক").refine(t=>Number(t)>=1&&Number(t)<=12,"১–১২ এর মধ্যে হতে হবে"),absenceYear:x().min(4,"বছর আবশ্যক").refine(t=>Number(t)>=1990&&Number(t)<=2100,"সঠিক বছর দিন")}),ae=P({presentAddress:I,permanentAddress:I}),re={"02-21":"Language Day","03-26":"Independence Day","04-14":"Pohela Boishakh","05-01":"May Day","08-15":"National Mourning Day","12-16":"Victory Day"},se=t=>`${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`in re,ie=t=>t.getDay()===5||t.getDay()===6,E=(t,r)=>{if(!t)return"";const s=new Date(t);let n=0;for(;n<r;)s.setDate(s.getDate()+1),!ie(s)&&!se(s)&&n++;return s.toISOString().split("T")[0]},oe=(t,r,s)=>{if(!t||!r||!s||s.length<4)return"";const n=Number(t),l=Number(r),d=Number(s);if(isNaN(n)||isNaN(l)||isNaN(d)||n<1||n>31||l<1||l>12||d<1900)return"";const j=`${d}-${String(l).padStart(2,"0")}-${String(n).padStart(2,"0")}`;return isNaN(new Date(j).getTime())?"":j};function O({title:t,titleEn:r,icon:s,prefix:n,disabled:l,control:d,errors:j}){return e.jsxs("div",{role:"group","aria-labelledby":`${n}-legend`,style:{flex:1,minWidth:200},children:[e.jsxs("div",{id:`${n}-legend`,style:{...F,marginBottom:10,fontSize:14},children:[t,e.jsxs("span",{style:{fontSize:12,color:"#94A3B8",fontWeight:400},children:["(",r,")"]})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12},children:[e.jsx(z,{name:`${n}.houseNo`,control:d,render:({field:i})=>e.jsx("div",{style:{gridColumn:"1 / -1"},children:e.jsx(g,{label:"বাড়ি / বাড়ি নং / রাস্তা",id:`${n}-houseNo`,children:e.jsx(f,{id:`${n}-houseNo`,...i,disabled:l,placeholder:"বাড়ি নং বা রাস্তার নাম"})})})}),e.jsx(z,{name:`${n}.village`,control:d,render:({field:i,fieldState:c})=>e.jsx(g,{label:"গ্রাম / মহল্লা",id:`${n}-village`,required:!0,error:c.error?.message,children:e.jsx(f,{id:`${n}-village`,...i,disabled:l,placeholder:"গ্রাম বা মহল্লা","aria-required":!0,"aria-invalid":!!c.error,"aria-describedby":c.error?`${n}-village-err`:void 0,error:!!c.error})})}),e.jsx(z,{name:`${n}.postOffice`,control:d,render:({field:i})=>e.jsx(g,{label:"ডাকঘর",id:`${n}-po`,children:e.jsx(f,{id:`${n}-po`,...i,disabled:l,placeholder:"ডাকঘরের নাম"})})}),e.jsx(z,{name:`${n}.thana`,control:d,render:({field:i})=>e.jsx(g,{label:"থানা",id:`${n}-thana`,children:e.jsx(f,{id:`${n}-thana`,...i,disabled:l,placeholder:"থানার নাম"})})}),e.jsx(z,{name:`${n}.district`,control:d,render:({field:i,fieldState:c})=>e.jsx(g,{label:"জেলা",id:`${n}-district`,required:!0,error:c.error?.message,children:e.jsx(f,{id:`${n}-district`,...i,disabled:l,placeholder:"জেলার নাম","aria-required":!0,"aria-invalid":!!c.error,error:!!c.error})})})]})]})}function de({employee:t,onChange:r,onDirtyChange:s}){const{register:n,control:l,watch:d,reset:j,formState:{errors:i,isDirty:c},trigger:h}=W({resolver:q(ne),mode:"onBlur",defaultValues:{name:t.name||"",fatherName:t.fatherName||"",motherName:t.motherName||"",cardNo:t.cardNo||"",designation:t.designation||"",section:t.section||"",gender:t.gender||"",husbandName:t.husbandName||"",joiningDate:t.joiningDate||"",absenceDay:t.absenceStartDate?.split("-")[2]||"",absenceMonth:t.absenceStartDate?.split("-")[1]||"",absenceYear:t.absenceStartDate?.split("-")[0]||""}});u.useEffect(()=>{j({name:t.name||"",fatherName:t.fatherName||"",motherName:t.motherName||"",cardNo:t.cardNo||"",designation:t.designation||"",section:t.section||"",gender:t.gender||"",husbandName:t.husbandName||"",joiningDate:t.joiningDate||"",absenceDay:t.absenceStartDate?.split("-")[2]||"",absenceMonth:t.absenceStartDate?.split("-")[1]||"",absenceYear:t.absenceStartDate?.split("-")[0]||""})},[t.cardNo]);const o=d("gender"),b=d("absenceDay"),A=d("absenceMonth"),N=d("absenceYear");return u.useEffect(()=>{s?.(c)},[c,s]),u.useEffect(()=>{const m=oe(b,A,N),D=m?E(m,10):"",S=D?E(D,10):"",B=S?E(S,7):"";r({...t,name:d("name"),fatherName:d("fatherName"),motherName:d("motherName"),cardNo:d("cardNo"),designation:d("designation"),section:d("section"),gender:d("gender"),husbandName:d("husbandName"),joiningDate:d("joiningDate"),absenceStartDate:m,firstNoticeDate:D,secondNoticeDate:S,thirdNoticeDate:B})},[b,A,N,o]),e.jsxs("div",{style:{paddingBottom:16},children:[e.jsxs("div",{style:k,children:[e.jsxs("div",{style:F,children:["সাধারণ তথ্য",e.jsx("span",{style:{fontSize:12,color:"#94A3B8",fontWeight:400},children:"Personal info"})]}),e.jsxs("div",{style:Q,children:[e.jsx(g,{label:"কর্মীর নাম",required:!0,id:"pf-name",error:i.name?.message,children:e.jsx(f,{id:"pf-name",placeholder:"যেমন: রাহেলা বেগম","aria-required":!0,"aria-invalid":!!i.name,"aria-describedby":i.name?"pf-name-err":void 0,error:!!i.name,...n("name",{onChange:m=>r({...t,name:m.target.value})})})}),e.jsx(g,{label:"পিতার নাম",id:"pf-father",children:e.jsx(f,{id:"pf-father",placeholder:"পিতার নাম",...n("fatherName",{onChange:m=>r({...t,fatherName:m.target.value})})})}),e.jsx(g,{label:"মাতার নাম",id:"pf-mother",children:e.jsx(f,{id:"pf-mother",placeholder:"মাতার নাম",...n("motherName",{onChange:m=>r({...t,motherName:m.target.value})})})}),e.jsx(g,{label:"কার্ড নং",required:!0,id:"pf-card",error:i.cardNo?.message,children:e.jsx(f,{id:"pf-card",placeholder:"যেমন: EMP-0042","aria-required":!0,"aria-invalid":!!i.cardNo,error:!!i.cardNo,...n("cardNo",{onChange:m=>r({...t,cardNo:m.target.value})})})}),e.jsx(g,{label:"পদবী",required:!0,id:"pf-desg",error:i.designation?.message,children:e.jsx(f,{id:"pf-desg",placeholder:"যেমন: অপারেটর","aria-required":!0,"aria-invalid":!!i.designation,error:!!i.designation,...n("designation",{onChange:m=>r({...t,designation:m.target.value})})})}),e.jsx(g,{label:"সেকশন",id:"pf-section",children:e.jsx(f,{id:"pf-section",placeholder:"যেমন: সুইং",...n("section",{onChange:m=>r({...t,section:m.target.value})})})}),e.jsx(g,{label:"লিঙ্গ",required:!0,id:"pf-gender",error:i.gender?.message,children:e.jsx(z,{name:"gender",control:l,render:({field:m,fieldState:D})=>e.jsx(X,{id:"pf-gender",value:m.value??"","aria-required":!0,"aria-invalid":!!D.error,error:!!D.error,placeholder:"লিঙ্গ নির্বাচন করুন",options:[{value:"male",label:"পুরুষ (Male)"},{value:"female",label:"নারী (Female)"},{value:"third",label:"অ-দ্বৈত / তৃতীয় লিঙ্গ"}],onChange:S=>{m.onChange(S),r({...t,gender:S.target.value})},onBlur:m.onBlur})})}),o==="female"&&e.jsx(g,{label:"স্বামীর নাম",id:"pf-husband",children:e.jsx(f,{id:"pf-husband",placeholder:"স্বামীর নাম",...n("husbandName",{onChange:m=>r({...t,husbandName:m.target.value})})})}),e.jsx(g,{label:"যোগদানের তারিখ",id:"pf-join",children:e.jsx(f,{id:"pf-join",type:"date",...n("joiningDate",{onChange:m=>r({...t,joiningDate:m.target.value})})})})]})]}),e.jsxs("div",{style:k,children:[e.jsxs("div",{style:F,children:["অনুপস্থিতির তারিখ",e.jsx("span",{style:{fontSize:12,color:"#94A3B8",fontWeight:400},children:"Absence start date"})]}),e.jsxs("fieldset",{style:{border:"none",padding:0},children:[e.jsx("legend",{style:{fontSize:12,color:"#64748B",marginBottom:10,fontFamily:ee},children:"দিন, মাস ও বছর আলাদাভাবে লিখুন"}),e.jsxs("div",{style:{display:"flex",gap:12,alignItems:"flex-start"},children:[e.jsx(g,{label:"দিন",id:"pf-abs-day",hint:"১–৩১",error:i.absenceDay?.message,children:e.jsx(f,{id:"pf-abs-day",type:"number",min:1,max:31,placeholder:"দিন",style:{textAlign:"center"},"aria-required":!0,"aria-invalid":!!i.absenceDay,error:!!i.absenceDay,...n("absenceDay",{onBlur:()=>h(["absenceDay","absenceMonth","absenceYear"])})})}),e.jsx(g,{label:"মাস",id:"pf-abs-month",hint:"১–১২",error:i.absenceMonth?.message,children:e.jsx(f,{id:"pf-abs-month",type:"number",min:1,max:12,placeholder:"মাস",style:{textAlign:"center"},"aria-required":!0,"aria-invalid":!!i.absenceMonth,error:!!i.absenceMonth,...n("absenceMonth",{onBlur:()=>h(["absenceDay","absenceMonth","absenceYear"])})})}),e.jsx(g,{label:"বছর",id:"pf-abs-year",hint:"যেমন: ২০২৬",error:i.absenceYear?.message,children:e.jsx(f,{id:"pf-abs-year",type:"number",min:1990,max:2100,placeholder:"বছর","aria-required":!0,"aria-invalid":!!i.absenceYear,error:!!i.absenceYear,...n("absenceYear",{onBlur:()=>h(["absenceDay","absenceMonth","absenceYear"])})})})]})]})]})]})}function le({employee:t,onChange:r,onDirtyChange:s}){const[n,l]=u.useState(!1),{control:d,watch:j,setValue:i,reset:c,formState:{isDirty:h}}=W({resolver:q(ae),mode:"onBlur",defaultValues:{presentAddress:{...t.presentAddress,houseNo:t.presentAddress.houseNo||""},permanentAddress:{...t.permanentAddress,houseNo:t.permanentAddress.houseNo||""}}});u.useEffect(()=>{c({presentAddress:{...t.presentAddress,houseNo:t.presentAddress.houseNo||""},permanentAddress:{...t.permanentAddress,houseNo:t.permanentAddress.houseNo||""}})},[t.cardNo]),u.useEffect(()=>{s?.(h)},[h,s]);const o=j("presentAddress");u.useEffect(()=>{n&&(i("permanentAddress",{...o},{shouldDirty:!0}),r({...t,permanentAddress:{...o}}))},[o,n]);const b=j("presentAddress"),A=j("permanentAddress");return u.useEffect(()=>{r({...t,presentAddress:b,permanentAddress:A})},[b,A]),e.jsx("div",{style:{paddingBottom:16},children:e.jsxs("div",{style:k,children:[e.jsxs("div",{style:{...F,justifyContent:"space-between",marginBottom:14},children:[e.jsxs("span",{style:{display:"flex",alignItems:"center",gap:8},children:["ঠিকানা",e.jsx("span",{style:{fontSize:12,color:"#94A3B8",fontWeight:400},children:"(Addresses)"})]}),e.jsx(te,{id:"addr-same",label:"উভয় ঠিকানা একই",hint:"টিক করলে স্থায়ী ঠিকানা স্বয়ংক্রিয়ভাবে পূরণ হবে",checked:n,onChange:N=>{l(N),N&&(i("permanentAddress",{...o},{shouldDirty:!0}),r({...t,permanentAddress:{...o}}))}})]}),e.jsxs("div",{style:{display:"flex",gap:16,flexWrap:"wrap"},children:[e.jsx("div",{style:{flex:1,minWidth:200,border:"1px solid #BFDBFE",borderRadius:10,padding:"14px 16px",background:"#FAFEFF"},children:e.jsx(O,{title:"বর্তমান ঠিকানা",titleEn:"Present address",icon:"ti-map-pin",prefix:"presentAddress",disabled:!1,control:d,errors:{}})}),e.jsx("div",{style:{display:"flex",alignItems:"center",color:"#CBD5E1",fontSize:20,userSelect:"none"},"aria-hidden":"true",children:n?"=":"≠"}),e.jsx("div",{style:{flex:1,minWidth:200,border:`1px solid ${n?"#E2E8F0":"#86EFAC"}`,borderRadius:10,padding:"14px 16px",background:n?"#F8FAFC":"#F0FDF4",opacity:n?.6:1,transition:"opacity .2s, border-color .2s"},children:e.jsx(O,{title:"স্থায়ী ঠিকানা",titleEn:"Permanent address",icon:"ti-home",prefix:"permanentAddress",disabled:n,control:d,errors:{}})})]})]})})}const ce=({employee:t,onChange:r,activeTab:s="personal",onDirtyChange:n})=>{const l=u.useCallback(d=>n?.(d),[n]);return s==="personal"?e.jsx(de,{employee:t,onChange:r,onDirtyChange:l}):e.jsx(le,{employee:t,onChange:r,onDirtyChange:l})},pe=({employee:t,title:r,content:s,authorization:n,noticeType:l})=>{const d=["শ্রমিকের ব্যক্তিগত নথি।","সংশ্লিষ্ট ব্যক্তি।"],i=(()=>{switch(l){case"notice1":return{absenceDate:v(t.absenceStartDate||""),noticeDate:v(t.firstNoticeDate||"")};case"notice2":return{absenceDate:v(t.absenceStartDate||""),firstNoticeDate:v(t.firstNoticeDate||""),noticeDate:v(t.secondNoticeDate||"")};case"notice3":return{absenceDate:v(t.absenceStartDate||""),firstNoticeDate:v(t.firstNoticeDate||""),secondNoticeDate:v(t.secondNoticeDate||""),noticeDate:v(t.thirdNoticeDate||"")};default:return{}}})(),c=()=>{if(s)return s;switch(l){case"notice1":return e.jsxs(e.Fragment,{children:[e.jsx("p",{className:"nl-subject",children:"বিষয় : বাংলাদেশ শ্রম আইন ২০০৬ এর ২৭ (৩ক) ধারা মোতাবেক ব্যাখ্যা প্রদান সহ চাকুরীতে যোগদানের জন্য নোটিশ।"}),e.jsx("p",{className:"nl-salute",children:"জনাব/জনাবা,"}),e.jsxs("p",{className:"nl-para",children:["আপনি গত ",e.jsx("u",{children:e.jsx("strong",{children:i.absenceDate})})," ইং তারিখ থেকে কারখানা কর্তৃপক্ষের বিনা অনুমতিতে কর্মস্থলে অনুপস্থিত রয়েছেন। আপনার এরূপ অনুপস্থিতি বাংলাদেশ শ্রম আইন ২০০৬ এর ২৭ (৩ক) ধারার আওতায় পড়ে।"]}),e.jsx("p",{className:"nl-para",children:"সুতরাং অত্র পত্র প্রাপ্তির ১০ (দশ) দিনের মধ্যে আপনার অনুপস্থিতির কারণ ব্যাখ্যা সহ কাজে যোগদানের জন্য আপনাকে নির্দেশ দেয়া হলো।"}),e.jsx("p",{className:"nl-para",children:"আপনার লিখিত জবাব উক্ত সময়ের মধ্যে নিম্নস্বাক্ষরকারীর নিকট অবশ্যই পৌঁছাতে হবে। অন্যথায় কর্তৃপক্ষ আপনার বিরুদ্ধে প্রয়োজনীয় আইনানুগ ব্যবস্থা নিতে বাধ্য হবে।"})]});case"notice2":return e.jsxs(e.Fragment,{children:[e.jsx("p",{className:"nl-subject",children:"বিষয় : বাংলাদেশ শ্রম আইন ২০০৬ এর ২৭ (৩ক) ধারা মোতাবেক আত্মপক্ষ সমর্থনের সুযোগ প্রদান প্রসঙ্গে।"}),e.jsx("p",{className:"nl-salute",children:"জনাব/জনাবা,"}),e.jsxs("p",{className:"nl-para",children:["আপনি গত ",e.jsx("u",{children:e.jsx("strong",{children:i.absenceDate})})," ইং তারিখ থেকে কারখানা কর্তৃপক্ষের বিনা অনুমতিতে কর্মস্থলে অনুপস্থিত রয়েছেন। এ প্রেক্ষিতে কারখানা কর্তৃপক্ষ আপনার স্থায়ী ও বর্তমান ঠিকানায় রেজিস্ট্রি ডাকযোগে গত ",e.jsx("u",{children:e.jsx("strong",{children:i.firstNoticeDate})})," ইং তারিখে বিনানুমতিতে চাকুরীতে অনুপস্থিতির কারণ ব্যাখ্যা সহ কাজে যোগদানের জন্য পত্র প্রেরণ করা হয়। কিন্তু অদ্যবধি আপনি উপরোক্ত বিষয়ে কোন ধরণের লিখিত ব্যাখ্যা প্রদান করেন নাই অথবা চাকুরীতেও যোগদান করেন নাই।"]}),e.jsx("p",{className:"nl-para",children:"অতএব, অত্র পত্র প্রাপ্তির ০৭ (সাত) দিনের মধ্যে আত্মপক্ষ সমর্থন সহ কাজে যোগদান করিতে আপনাকে নির্দেশ দেয়া গেল।"}),e.jsx("p",{className:"nl-para",children:"উক্ত সময়ের মধ্যে আপনি আত্মপক্ষ সমর্থনের জবাব সহ কাজে যোগদান করতে ব্যর্থ হলে বাংলাদেশ শ্রম আইন ২০০৬ এর ২৭ (৩ক) ধারা অনুযায়ী আপনি স্বেচ্ছায় চাকুরী থেকে ইস্তফা গ্রহণ করেছেন বলে গণ্য হবে।"})]});case"notice3":return e.jsxs(e.Fragment,{children:[e.jsx("p",{className:"nl-subject",children:"বিষয় : বাংলাদেশ শ্রম আইন ২০০৬ এর ২৭ (৩ক) ধারা মোতাবেক শ্রমিক কর্তৃক স্বেচ্ছায় চাকুরী হইতে ইস্তফা প্রসঙ্গে।"}),e.jsx("p",{className:"nl-salute",children:"জনাব/জনাবা,"}),e.jsxs("p",{className:"nl-para",children:["আপনি গত ",e.jsx("u",{children:e.jsx("strong",{children:i.absenceDate})})," ইং তারিখ হতে অদ্যবধি পর্যন্ত কর্তৃপক্ষের বিনা অনুমতিতে কর্মস্থলে অনুপস্থিত থাকার আপনাকে গত ",e.jsx("u",{children:e.jsx("strong",{children:i.firstNoticeDate})})," ইং তারিখে একটি পত্রের মাধ্যমে ১০ (দশ) দিনের সময় দিয়ে চাকুরীতে যোগদান সহ ব্যাখ্যা প্রদান করতে বলা হয়েছিল। কিন্তু আপনি নির্ধারিত সময়ের মধ্যে কর্মস্থলে উপস্থিত হননি এবং কোন ব্যাখ্যা প্রদান করেননি।"]}),e.jsxs("p",{className:"nl-para",children:["তথাপি কর্তৃপক্ষ গত ",e.jsx("u",{children:e.jsx("strong",{children:i.secondNoticeDate})})," ইং তারিখে আর একটি পত্রের মাধ্যমে আপনাকে আরো ৭ (সাত) দিনের সময় দিয়ে আত্মপক্ষ সমর্থন সহ চাকুরীতে যোগদানের জন্য পুনরায় নির্দেশ প্রদান করেন। তৎসত্ত্বেও আপনি নির্ধারিত সময়ের মধ্যে আত্মপক্ষ করেননি এবং যোগদান করেননি।"]}),e.jsx("p",{className:"nl-para",children:"সুতরাং বাংলাদেশ শ্রম আইন, ২০০৬ এর ২৭ (৩ক) ধারা অনুযায়ী অনুপস্থিত দিন থেকে আপনি চাকুরী হতে স্বেচ্ছায় ইস্তফা গ্রহণ করেছেন বলে গণ্য করা হলো।"}),e.jsx("p",{className:"nl-para",children:"অতএব, আপনার বকেয়া মজুরী ও আইনানুগ পাওনা (যদি থাকে) যে কোন কর্মদিবসে অফিস চলাকালীন সময়ে কারখানার হিসাব শাখা থেকে গ্রহণ করার জন্য নির্দেশ দেয়া গেল।"})]});default:return null}};return e.jsxs("div",{className:"nl-page",children:[e.jsxs("div",{className:"nl-wrap",children:[e.jsxs("div",{className:"nl-header",children:[t.companyName&&e.jsx("h1",{className:"nl-co-name",children:t.companyName}),t.companyAddress&&e.jsx("p",{className:"nl-co-addr",children:t.companyAddress})]}),e.jsxs("div",{className:"nl-title-bar",children:[e.jsx("h2",{className:"nl-title",children:'"রেজিস্টার্ড ডাকযোগে প্রেরিত"'}),i.noticeDate&&e.jsxs("div",{className:"nl-meta",children:[e.jsxs("span",{className:"nl-meta-type",children:["(",r,")"]}),e.jsxs("span",{className:"nl-meta-date",children:["তারিখ : ",e.jsxs("strong",{children:[y(i.noticeDate)," ইং"]})]})]})]}),e.jsx("p",{className:"nl-to",children:"প্রতি,"}),e.jsxs("div",{className:"nl-emp-box",children:[e.jsxs("div",{className:"nl-emp-col",children:[e.jsx("div",{className:"nl-emp-head",children:"ব্যক্তিগত তথ্য"}),e.jsx("table",{className:"nl-emp-tbl",children:e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:"নাম"}),e.jsx("td",{children:t.name||"—"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"পিতার নাম"}),e.jsx("td",{children:t.fatherName||"—"})]}),t.motherName&&e.jsxs("tr",{children:[e.jsx("td",{children:"মাতার নাম"}),e.jsx("td",{children:t.motherName})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"পদবী"}),e.jsx("td",{children:t.designation||"—"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"কার্ড নং"}),e.jsx("td",{children:t.cardNo||"—"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"সেকশন"}),e.jsx("td",{children:t.section||"—"})]}),t.joiningDate&&e.jsxs("tr",{children:[e.jsx("td",{children:"যোগদান"}),e.jsx("td",{children:v(t.joiningDate)})]})]})})]}),e.jsx("div",{className:"nl-emp-divider"}),e.jsxs("div",{className:"nl-emp-col",children:[e.jsx("div",{className:"nl-emp-head",children:"বর্তমান ঠিকানা"}),e.jsx("table",{className:"nl-emp-tbl",children:e.jsxs("tbody",{children:[t.presentAddress.houseNo&&e.jsxs("tr",{children:[e.jsx("td",{children:"বাড়ি"}),e.jsx("td",{children:t.presentAddress.houseNo})]}),t.presentAddress.village&&e.jsxs("tr",{children:[e.jsx("td",{children:"গ্রাম"}),e.jsx("td",{children:t.presentAddress.village})]}),t.presentAddress.postOffice&&e.jsxs("tr",{children:[e.jsx("td",{children:"ডাকঘর"}),e.jsx("td",{children:t.presentAddress.postOffice})]}),t.presentAddress.thana&&e.jsxs("tr",{children:[e.jsx("td",{children:"থানা"}),e.jsx("td",{children:t.presentAddress.thana})]}),t.presentAddress.district&&e.jsxs("tr",{children:[e.jsx("td",{children:"জেলা"}),e.jsx("td",{children:t.presentAddress.district})]})]})})]}),e.jsx("div",{className:"nl-emp-divider"}),e.jsxs("div",{className:"nl-emp-col",children:[e.jsx("div",{className:"nl-emp-head",children:"স্থায়ী ঠিকানা"}),e.jsx("table",{className:"nl-emp-tbl",children:e.jsxs("tbody",{children:[t.permanentAddress.houseNo&&e.jsxs("tr",{children:[e.jsx("td",{children:"বাড়ি"}),e.jsx("td",{children:t.permanentAddress.houseNo})]}),t.permanentAddress.village&&e.jsxs("tr",{children:[e.jsx("td",{children:"গ্রাম"}),e.jsx("td",{children:t.permanentAddress.village})]}),t.permanentAddress.postOffice&&e.jsxs("tr",{children:[e.jsx("td",{children:"ডাকঘর"}),e.jsx("td",{children:t.permanentAddress.postOffice})]}),t.permanentAddress.thana&&e.jsxs("tr",{children:[e.jsx("td",{children:"থানা"}),e.jsx("td",{children:t.permanentAddress.thana})]}),t.permanentAddress.district&&e.jsxs("tr",{children:[e.jsx("td",{children:"জেলা"}),e.jsx("td",{children:t.permanentAddress.district})]})]})})]})]}),e.jsx("div",{className:"nl-body",children:c()}),l&&e.jsxs("div",{className:"nl-copy",children:[e.jsx("p",{children:e.jsx("strong",{children:e.jsx("u",{children:"অনুলিপি :"})})}),e.jsx("ol",{children:d.map((h,o)=>e.jsxs("li",{children:[e.jsxs("span",{children:[y(String(o+1)),"."]}),h]},o))})]}),l&&e.jsxs("div",{className:"nl-footer",children:[e.jsx("p",{className:"nl-authority",children:"কর্তৃপক্ষের নির্দেশক্রমে"}),n&&e.jsx(G,{value:n,lang:"bn",hidePrepared:!0,hideTopBorder:!0})]})]}),e.jsx("style",{children:`
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
      `})]})};function M({employee:t,address:r,addressLabel:s}){const n=T(),l=[r.houseNo,r.village,r.postOffice,r.thana,r.district].filter(Boolean).join(", ");return e.jsx("div",{className:"envelope-container",children:e.jsxs("div",{className:"envelope",children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start"},children:[e.jsxs("div",{style:{maxWidth:"55%"},children:[e.jsx("p",{style:{fontSize:"8pt",fontWeight:700,color:"#111827",margin:0,textDecoration:"underline"},children:"From"}),e.jsx("p",{style:{fontSize:"9pt",fontWeight:700,color:"#111827",margin:"3pt 0 0"},children:t.companyName||n.nameEn}),e.jsx("p",{style:{fontSize:"8pt",color:"#374151",margin:"1pt 0 0",lineHeight:1.35},children:t.companyAddress||"32, Lakshmipura, Chandana, Joydevpur, Gazipur-1700"})]}),e.jsx("div",{style:{width:"32mm",height:"18mm",flexShrink:0,border:"1px dashed #9ca3af",borderRadius:"2px",display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx("span",{style:{fontSize:"6.5pt",color:"#9ca3af"},children:"Postage / Stamp"})})]}),e.jsxs("div",{style:{marginTop:"14mm"},children:[e.jsx("p",{style:{fontSize:"10pt",fontWeight:700,color:"#111827",margin:0},children:"To"}),e.jsx("p",{style:{fontSize:"9pt",fontWeight:700,color:"#111827",margin:"5pt 0 3pt",textDecoration:"underline"},children:s}),e.jsx("p",{style:{fontSize:"11pt",fontWeight:700,color:"#111827",margin:"4pt 0 0"},children:t.name||"Employee Name"}),(t.fatherName||t.husbandName)&&e.jsx("p",{style:{fontSize:"8.5pt",color:"#1f2937",margin:"2pt 0 0"},children:t.fatherName?`son/daughter of ${t.fatherName}`:`wife of ${t.husbandName}`}),l&&e.jsx("p",{style:{fontSize:"9.5pt",color:"#1f2937",margin:"4pt 0 0",lineHeight:1.6,maxWidth:"85%"},children:l})]})]})})}const me=({employee:t,addressType:r="both"})=>{const s=r==="present"||r==="both",n=r==="permanent"||r==="both";return e.jsxs("div",{className:"envelope-page",children:[s&&e.jsx(M,{employee:t,address:t.presentAddress,addressLabel:"বর্তমান ঠিকানা (Present Address)"}),n&&e.jsx(M,{employee:t,address:t.permanentAddress,addressLabel:"স্থায়ী ঠিকানা (Permanent Address)"}),e.jsx("style",{children:`
        ${$}
        ${L}

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
      `})]})},he=[{id:"personal",label:"সাধারণ তথ্য",icon:"ti-user-circle"},{id:"address",label:"ঠিকানা",icon:"ti-map-pin"}];function R(t,r){let s={};try{s=JSON.parse(String(t.addressesJson??"{}"))??{}}catch{}return{...r,name:String(t.employeeName??""),fatherName:String(t.fatherName??""),motherName:String(t.motherName??""),gender:String(t.gender??""),husbandName:String(t.husbandName??""),cardNo:String(t.cardNo??""),designation:String(t.designation??""),section:String(t.department??""),date:w(t.date),joiningDate:w(t.joiningDate),absenceStartDate:w(t.absentFrom),firstNoticeDate:w(t.firstNoticeDate),secondNoticeDate:w(t.secondNoticeDate),thirdNoticeDate:w(t.thirdNoticeDate),presentAddress:s.present??r.presentAddress,permanentAddress:s.permanent??r.permanentAddress}}function De(){const t=T(),{user:r}=_(),s=U("leftnotice",t.id,r?.name??"unknown"),n=u.useRef(null),[l,d]=u.useState(Z),[j,i]=u.useState(!1),[c,h]=u.useState("personal"),[o,b]=u.useState(C);u.useEffect(()=>{b(a=>({...a,companyName:t.nameBn,companyAddress:t.addressBn,date:a.date||new Date().toISOString().split("T")[0]}))},[t.id]);const A=!!(o.name&&o.cardNo&&o.companyName),N=!!o.absenceStartDate,m=()=>{i(!1),b(a=>({...C,companyName:a.companyName,companyAddress:a.companyAddress})),h("personal"),s.setEditingId(null)},D=()=>window.print(),S=async()=>{const a=n.current;a&&await J({element:a,filename:`LeftNotice_${o.name||"document"}`,scale:2})},B=()=>({employeeName:o.name,cardNo:o.cardNo,designation:o.designation,department:o.section,fatherName:o.fatherName??"",motherName:o.motherName??"",gender:o.gender??"",husbandName:o.husbandName??"",date:o.date??"",joiningDate:o.joiningDate??"",absentFrom:o.absenceStartDate??"",firstNoticeDate:o.firstNoticeDate??"",secondNoticeDate:o.secondNoticeDate??"",thirdNoticeDate:o.thirdNoticeDate??"",noticeType:"notice1",addressesJson:JSON.stringify({present:o.presentAddress,permanent:o.permanentAddress})}),Y=[{label:"পত্র নং-১",onClick:()=>N&&h("notice1")},{label:"পত্র নং-২",onClick:()=>N&&h("notice2")},{label:"পত্র নং-৩",onClick:()=>N&&h("notice3")},{label:"খাম",onClick:()=>{},subItems:[{label:"বর্তমান ঠিকানা",onClick:()=>N&&h("envelope-present"),active:c==="envelope-present"},{label:"স্থায়ী ঠিকানা",onClick:()=>N&&h("envelope-permanent"),active:c==="envelope-permanent"}]}],V=c!=="personal"&&c!=="address",H=c==="personal"||c==="address"?c:"personal";return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`
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

        ${$}${L}

        @media print {
          @page { size: A4 portrait; margin: 25mm 20mm 20mm 25mm; }
          body { font-family: 'Noto Sans Bengali', Arial, sans-serif !important; }
          .print-content, .print-content * {
            font-family: 'Noto Sans Bengali', Arial, sans-serif !important;
            color: #000 !important;
          }
        }
      `}),e.jsxs(K,{moduleName:"কর্মী অনুপস্থিতি নোটিশ",moduleNameEn:"Left Worker Notice",date:o.date,onDateChange:a=>b(p=>({...p,date:a})),steps:he,activeStep:H,onStepChange:a=>h(a),billItems:Y,isBillActive:V,onSave:async()=>{const a=B(),p=s.editingId?await s.update(s.editingId,a):await s.save(a);return p&&m(),p},isSaving:s.isSaving,configured:s.configured,adapterName:s.adapterName,saveDisabled:!A,editingId:s.editingId,onCancelEdit:m,isDirty:j,onReset:m,onUpdate:a=>{s.setEditingId(String(a.id??"")),b(p=>R(a,p)),h("personal")},updateModule:"leftnotice",updateLabel:"Left Notice রেকর্ড খুঁজুন",updateSearchPlaceholder:"নাম, কার্ড নং বা পদবী দিয়ে খুঁজুন...",onEmployeeSelect:a=>{b(p=>({...p,name:String(a.fullNameBengali??a.fullName??p.name),fatherName:String(a.fatherName??p.fatherName),motherName:String(a.motherName??p.motherName??""),gender:String(a.gender??p.gender??""),designation:String(a.designation??p.designation),cardNo:String(a.cardNo??p.cardNo),section:String(a.sectionLine??a.department??p.section),joiningDate:String(a.joiningDate??p.joiningDate??""),presentAddress:{houseNo:String(a.presentHouseNo??p.presentAddress.houseNo),village:String(a.presentVillage??p.presentAddress.village),postOffice:String(a.presentPostOffice??p.presentAddress.postOffice),thana:String(a.presentThana??p.presentAddress.thana),district:String(a.presentDistrict??p.presentAddress.district)},permanentAddress:{houseNo:String(a.permanentHouseNo??p.permanentAddress.houseNo),village:String(a.permanentVillage??p.permanentAddress.village),postOffice:String(a.permanentPostOffice??p.permanentAddress.postOffice),thana:String(a.permanentThana??p.permanentAddress.thana),district:String(a.permanentDistrict??p.permanentAddress.district)}})),i(!0)},calcRows:[{label:"১ম নোটিশ",value:o.firstNoticeDate?y(o.firstNoticeDate.split("-").reverse().join("/")):"—"},{label:"২য় নোটিশ",value:o.secondNoticeDate?y(o.secondNoticeDate.split("-").reverse().join("/")):"—"},{label:"চূড়ান্ত নোটিশ",value:o.thirdNoticeDate?y(o.thirdNoticeDate.split("-").reverse().join("/")):"—"}],records:s.records,isLoading:s.isLoading,onLoadRecord:a=>{s.setEditingId(String(a.id??"")),b(p=>R(a,p)),h("personal"),window.scrollTo({top:0,behavior:"smooth"})},onDeleteRecord:s.remove,onReload:s.reload,auth:l,onAuthChange:d,onPrint:D,onPDF:S,lang:"bn",children:[(c==="personal"||c==="address")&&e.jsx(e.Fragment,{children:e.jsx(ce,{employee:o,onChange:a=>{i(!0),b(a)},activeTab:c,onDirtyChange:a=>{a&&i(!0)}},s.editingId??"new")}),(c==="envelope-present"||c==="envelope-permanent")&&e.jsx("div",{id:"printable-area",ref:n,children:e.jsx(me,{employee:o,addressType:c==="envelope-present"?"present":"permanent"})}),["notice1","notice2","notice3"].map((a,p)=>c===a&&e.jsx("div",{id:"printable-area",ref:n,children:e.jsx(pe,{employee:o,title:`পত্র নং-${y(p+1)}`,noticeType:a,authorization:l})},a))]})]})}export{De as default};
