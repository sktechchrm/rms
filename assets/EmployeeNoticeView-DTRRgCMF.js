import{r as b,j as e,u as L,a as _,e as J}from"./index-BcNP_X5V.js";import{B as $,P as T,u as U}from"./printCSS-CCabjiFQ.js";import{P as G,D as K,M as Z,t as w}from"./ModuleShell-C-y_84xe.js";import{t as y}from"./bnEnDate-DcYhykOO.js";import{u as W,a as q,c as k,b as B,g as Q,F as g,I as x,C as z,S as X,f as ee,d as te,o as P,s as f}from"./FormField-CrEbT6iJ.js";import"./DatabaseFactory-BPeoXXZi.js";import"./AuthorityIconButton-j8BmlnOE.js";import"./DataUseCases-DKVtdW5f.js";const C={name:"",fatherName:"",motherName:"",gender:"",husbandName:"",designation:"",cardNo:"",section:"",date:"",joiningDate:"",absenceStartDate:"",firstNoticeDate:"",secondNoticeDate:"",thirdNoticeDate:"",companyName:"",companyAddress:"",presentAddress:{houseNo:"",village:"",postOffice:"",thana:"",district:""},permanentAddress:{houseNo:"",village:"",postOffice:"",thana:"",district:""}},D=t=>{if(!t)return"";const s=new Date(t),i=String(s.getDate()).padStart(2,"0"),n=String(s.getMonth()+1).padStart(2,"0"),p=s.getFullYear(),d=`${i}/${n}/${p}`;return y(d)},I=P({houseNo:f().default(""),village:f().min(1,"গ্রাম / মহল্লা আবশ্যক"),postOffice:f().default(""),thana:f().default(""),district:f().min(1,"জেলা আবশ্যক")}),ne=P({name:f().min(1,"কর্মীর নাম আবশ্যক"),fatherName:f().default(""),motherName:f().default(""),cardNo:f().min(1,"কার্ড নং আবশ্যক"),designation:f().min(1,"পদবী আবশ্যক"),section:f().default(""),gender:f().min(1,"লিঙ্গ নির্বাচন করুন").refine(t=>["male","female","third"].includes(t),"লিঙ্গ নির্বাচন করুন"),husbandName:f().default(""),joiningDate:f().default(""),absenceDay:f().min(1,"দিন আবশ্যক").refine(t=>Number(t)>=1&&Number(t)<=31,"১–৩১ এর মধ্যে হতে হবে"),absenceMonth:f().min(1,"মাস আবশ্যক").refine(t=>Number(t)>=1&&Number(t)<=12,"১–১২ এর মধ্যে হতে হবে"),absenceYear:f().min(4,"বছর আবশ্যক").refine(t=>Number(t)>=1990&&Number(t)<=2100,"সঠিক বছর দিন")}),ae=P({presentAddress:I,permanentAddress:I}),se={"02-21":"Language Day","03-26":"Independence Day","04-14":"Pohela Boishakh","05-01":"May Day","08-15":"National Mourning Day","12-16":"Victory Day"},ie=t=>`${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`in se,re=t=>t.getDay()===5||t.getDay()===6,E=(t,s)=>{if(!t)return"";const i=new Date(t);let n=0;for(;n<s;)i.setDate(i.getDate()+1),!re(i)&&!ie(i)&&n++;return i.toISOString().split("T")[0]},oe=(t,s,i)=>{if(!t||!s||!i||i.length<4)return"";const n=Number(t),p=Number(s),d=Number(i);if(isNaN(n)||isNaN(p)||isNaN(d)||n<1||n>31||p<1||p>12||d<1900)return"";const N=`${d}-${String(p).padStart(2,"0")}-${String(n).padStart(2,"0")}`;return isNaN(new Date(N).getTime())?"":N};function O({title:t,titleEn:s,icon:i,prefix:n,disabled:p,control:d,errors:N}){return e.jsxs("div",{role:"group","aria-labelledby":`${n}-legend`,style:{flex:1,minWidth:200},children:[e.jsxs("div",{id:`${n}-legend`,style:{...B,marginBottom:10,fontSize:14},children:[t,e.jsxs("span",{style:{fontSize:12,color:"#94A3B8",fontWeight:400},children:["(",s,")"]})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12},children:[e.jsx(z,{name:`${n}.houseNo`,control:d,render:({field:o})=>e.jsx("div",{style:{gridColumn:"1 / -1"},children:e.jsx(g,{label:"বাড়ি / বাড়ি নং / রাস্তা",id:`${n}-houseNo`,children:e.jsx(x,{id:`${n}-houseNo`,...o,disabled:p,placeholder:"বাড়ি নং বা রাস্তার নাম"})})})}),e.jsx(z,{name:`${n}.village`,control:d,render:({field:o,fieldState:c})=>e.jsx(g,{label:"গ্রাম / মহল্লা",id:`${n}-village`,required:!0,error:c.error?.message,children:e.jsx(x,{id:`${n}-village`,...o,disabled:p,placeholder:"গ্রাম বা মহল্লা","aria-required":!0,"aria-invalid":!!c.error,"aria-describedby":c.error?`${n}-village-err`:void 0,error:!!c.error})})}),e.jsx(z,{name:`${n}.postOffice`,control:d,render:({field:o})=>e.jsx(g,{label:"ডাকঘর",id:`${n}-po`,children:e.jsx(x,{id:`${n}-po`,...o,disabled:p,placeholder:"ডাকঘরের নাম"})})}),e.jsx(z,{name:`${n}.thana`,control:d,render:({field:o})=>e.jsx(g,{label:"থানা",id:`${n}-thana`,children:e.jsx(x,{id:`${n}-thana`,...o,disabled:p,placeholder:"থানার নাম"})})}),e.jsx(z,{name:`${n}.district`,control:d,render:({field:o,fieldState:c})=>e.jsx(g,{label:"জেলা",id:`${n}-district`,required:!0,error:c.error?.message,children:e.jsx(x,{id:`${n}-district`,...o,disabled:p,placeholder:"জেলার নাম","aria-required":!0,"aria-invalid":!!c.error,error:!!c.error})})})]})]})}function de({employee:t,onChange:s,onDirtyChange:i}){const{register:n,control:p,watch:d,reset:N,formState:{errors:o,isDirty:c},trigger:h}=W({resolver:q(ne),mode:"onBlur",defaultValues:{name:t.name||"",fatherName:t.fatherName||"",motherName:t.motherName||"",cardNo:t.cardNo||"",designation:t.designation||"",section:t.section||"",gender:t.gender||"",husbandName:t.husbandName||"",joiningDate:t.joiningDate||"",absenceDay:t.absenceStartDate?.split("-")[2]||"",absenceMonth:t.absenceStartDate?.split("-")[1]||"",absenceYear:t.absenceStartDate?.split("-")[0]||""}});b.useEffect(()=>{N({name:t.name||"",fatherName:t.fatherName||"",motherName:t.motherName||"",cardNo:t.cardNo||"",designation:t.designation||"",section:t.section||"",gender:t.gender||"",husbandName:t.husbandName||"",joiningDate:t.joiningDate||"",absenceDay:t.absenceStartDate?.split("-")[2]||"",absenceMonth:t.absenceStartDate?.split("-")[1]||"",absenceYear:t.absenceStartDate?.split("-")[0]||""})},[t.cardNo]);const r=d("gender"),u=d("absenceDay"),A=d("absenceMonth"),j=d("absenceYear");return b.useEffect(()=>{i?.(c)},[c,i]),b.useEffect(()=>{const m=oe(u,A,j),v=m?E(m,10):"",S=v?E(v,10):"",F=S?E(S,7):"";s({...t,name:d("name"),fatherName:d("fatherName"),motherName:d("motherName"),cardNo:d("cardNo"),designation:d("designation"),section:d("section"),gender:d("gender"),husbandName:d("husbandName"),joiningDate:d("joiningDate"),absenceStartDate:m,firstNoticeDate:v,secondNoticeDate:S,thirdNoticeDate:F})},[u,A,j,r]),e.jsxs("div",{style:{paddingBottom:16},children:[e.jsxs("div",{style:k,children:[e.jsxs("div",{style:B,children:["সাধারণ তথ্য",e.jsx("span",{style:{fontSize:12,color:"#94A3B8",fontWeight:400},children:"Personal info"})]}),e.jsxs("div",{style:Q,children:[e.jsx(g,{label:"কর্মীর নাম",required:!0,id:"pf-name",error:o.name?.message,children:e.jsx(x,{id:"pf-name",placeholder:"যেমন: রাহেলা বেগম","aria-required":!0,"aria-invalid":!!o.name,"aria-describedby":o.name?"pf-name-err":void 0,error:!!o.name,...n("name",{onChange:m=>s({...t,name:m.target.value})})})}),e.jsx(g,{label:"পিতার নাম",id:"pf-father",children:e.jsx(x,{id:"pf-father",placeholder:"পিতার নাম",...n("fatherName",{onChange:m=>s({...t,fatherName:m.target.value})})})}),e.jsx(g,{label:"মাতার নাম",id:"pf-mother",children:e.jsx(x,{id:"pf-mother",placeholder:"মাতার নাম",...n("motherName",{onChange:m=>s({...t,motherName:m.target.value})})})}),e.jsx(g,{label:"কার্ড নং",required:!0,id:"pf-card",error:o.cardNo?.message,children:e.jsx(x,{id:"pf-card",placeholder:"যেমন: EMP-0042","aria-required":!0,"aria-invalid":!!o.cardNo,error:!!o.cardNo,...n("cardNo",{onChange:m=>s({...t,cardNo:m.target.value})})})}),e.jsx(g,{label:"পদবী",required:!0,id:"pf-desg",error:o.designation?.message,children:e.jsx(x,{id:"pf-desg",placeholder:"যেমন: অপারেটর","aria-required":!0,"aria-invalid":!!o.designation,error:!!o.designation,...n("designation",{onChange:m=>s({...t,designation:m.target.value})})})}),e.jsx(g,{label:"সেকশন",id:"pf-section",children:e.jsx(x,{id:"pf-section",placeholder:"যেমন: সুইং",...n("section",{onChange:m=>s({...t,section:m.target.value})})})}),e.jsx(g,{label:"লিঙ্গ",required:!0,id:"pf-gender",error:o.gender?.message,children:e.jsx(z,{name:"gender",control:p,render:({field:m,fieldState:v})=>e.jsx(X,{id:"pf-gender",value:m.value??"","aria-required":!0,"aria-invalid":!!v.error,error:!!v.error,placeholder:"লিঙ্গ নির্বাচন করুন",options:[{value:"male",label:"পুরুষ (Male)"},{value:"female",label:"নারী (Female)"},{value:"third",label:"অ-দ্বৈত / তৃতীয় লিঙ্গ"}],onChange:S=>{m.onChange(S),s({...t,gender:S.target.value})},onBlur:m.onBlur})})}),r==="female"&&e.jsx(g,{label:"স্বামীর নাম",id:"pf-husband",children:e.jsx(x,{id:"pf-husband",placeholder:"স্বামীর নাম",...n("husbandName",{onChange:m=>s({...t,husbandName:m.target.value})})})}),e.jsx(g,{label:"যোগদানের তারিখ",id:"pf-join",children:e.jsx(x,{id:"pf-join",type:"date",...n("joiningDate",{onChange:m=>s({...t,joiningDate:m.target.value})})})})]})]}),e.jsxs("div",{style:k,children:[e.jsxs("div",{style:B,children:["অনুপস্থিতির তারিখ",e.jsx("span",{style:{fontSize:12,color:"#94A3B8",fontWeight:400},children:"Absence start date"})]}),e.jsxs("fieldset",{style:{border:"none",padding:0},children:[e.jsx("legend",{style:{fontSize:12,color:"#64748B",marginBottom:10,fontFamily:ee},children:"দিন, মাস ও বছর আলাদাভাবে লিখুন"}),e.jsxs("div",{style:{display:"flex",gap:12,alignItems:"flex-start"},children:[e.jsx(g,{label:"দিন",id:"pf-abs-day",hint:"১–৩১",error:o.absenceDay?.message,children:e.jsx(x,{id:"pf-abs-day",type:"number",min:1,max:31,placeholder:"দিন",style:{textAlign:"center"},"aria-required":!0,"aria-invalid":!!o.absenceDay,error:!!o.absenceDay,...n("absenceDay",{onBlur:()=>h(["absenceDay","absenceMonth","absenceYear"])})})}),e.jsx(g,{label:"মাস",id:"pf-abs-month",hint:"১–১২",error:o.absenceMonth?.message,children:e.jsx(x,{id:"pf-abs-month",type:"number",min:1,max:12,placeholder:"মাস",style:{textAlign:"center"},"aria-required":!0,"aria-invalid":!!o.absenceMonth,error:!!o.absenceMonth,...n("absenceMonth",{onBlur:()=>h(["absenceDay","absenceMonth","absenceYear"])})})}),e.jsx(g,{label:"বছর",id:"pf-abs-year",hint:"যেমন: ২০২৬",error:o.absenceYear?.message,children:e.jsx(x,{id:"pf-abs-year",type:"number",min:1990,max:2100,placeholder:"বছর","aria-required":!0,"aria-invalid":!!o.absenceYear,error:!!o.absenceYear,...n("absenceYear",{onBlur:()=>h(["absenceDay","absenceMonth","absenceYear"])})})})]})]})]})]})}function ce({employee:t,onChange:s,onDirtyChange:i}){const[n,p]=b.useState(!1),{control:d,watch:N,setValue:o,reset:c,formState:{isDirty:h}}=W({resolver:q(ae),mode:"onBlur",defaultValues:{presentAddress:{...t.presentAddress,houseNo:t.presentAddress.houseNo||""},permanentAddress:{...t.permanentAddress,houseNo:t.permanentAddress.houseNo||""}}});b.useEffect(()=>{c({presentAddress:{...t.presentAddress,houseNo:t.presentAddress.houseNo||""},permanentAddress:{...t.permanentAddress,houseNo:t.permanentAddress.houseNo||""}})},[t.cardNo]),b.useEffect(()=>{i?.(h)},[h,i]);const r=N("presentAddress");b.useEffect(()=>{n&&(o("permanentAddress",{...r},{shouldDirty:!0}),s({...t,permanentAddress:{...r}}))},[r,n]);const u=N("presentAddress"),A=N("permanentAddress");return b.useEffect(()=>{s({...t,presentAddress:u,permanentAddress:A})},[u,A]),e.jsx("div",{style:{paddingBottom:16},children:e.jsxs("div",{style:k,children:[e.jsxs("div",{style:{...B,justifyContent:"space-between",marginBottom:14},children:[e.jsxs("span",{style:{display:"flex",alignItems:"center",gap:8},children:["ঠিকানা",e.jsx("span",{style:{fontSize:12,color:"#94A3B8",fontWeight:400},children:"(Addresses)"})]}),e.jsx(te,{id:"addr-same",label:"উভয় ঠিকানা একই",hint:"টিক করলে স্থায়ী ঠিকানা স্বয়ংক্রিয়ভাবে পূরণ হবে",checked:n,onChange:j=>{p(j),j&&(o("permanentAddress",{...r},{shouldDirty:!0}),s({...t,permanentAddress:{...r}}))}})]}),e.jsxs("div",{style:{display:"flex",gap:16,flexWrap:"wrap"},children:[e.jsx("div",{style:{flex:1,minWidth:200,border:"1px solid #BFDBFE",borderRadius:10,padding:"14px 16px",background:"#FAFEFF"},children:e.jsx(O,{title:"বর্তমান ঠিকানা",titleEn:"Present address",icon:"ti-map-pin",prefix:"presentAddress",disabled:!1,control:d,errors:{}})}),e.jsx("div",{style:{display:"flex",alignItems:"center",color:"#CBD5E1",fontSize:20,userSelect:"none"},"aria-hidden":"true",children:n?"=":"≠"}),e.jsx("div",{style:{flex:1,minWidth:200,border:`1px solid ${n?"#E2E8F0":"#86EFAC"}`,borderRadius:10,padding:"14px 16px",background:n?"#F8FAFC":"#F0FDF4",opacity:n?.6:1,transition:"opacity .2s, border-color .2s"},children:e.jsx(O,{title:"স্থায়ী ঠিকানা",titleEn:"Permanent address",icon:"ti-home",prefix:"permanentAddress",disabled:n,control:d,errors:{}})})]})]})})}const le=({employee:t,onChange:s,activeTab:i="personal",onDirtyChange:n})=>{const p=b.useCallback(d=>n?.(d),[n]);return i==="personal"?e.jsx(de,{employee:t,onChange:s,onDirtyChange:p}):e.jsx(ce,{employee:t,onChange:s,onDirtyChange:p})},pe=({employee:t,title:s,content:i,hideDefaultFooter:n=!1,authorization:p,noticeType:d})=>{const N=["শ্রমিকের ব্যক্তিগত নথি।","সংশ্লিষ্ট ব্যক্তি।"],c=(()=>{switch(d){case"notice1":return{absenceDate:D(t.absenceStartDate||""),noticeDate:D(t.firstNoticeDate||"")};case"notice2":return{absenceDate:D(t.absenceStartDate||""),firstNoticeDate:D(t.firstNoticeDate||""),noticeDate:D(t.secondNoticeDate||"")};case"notice3":return{absenceDate:D(t.absenceStartDate||""),firstNoticeDate:D(t.firstNoticeDate||""),secondNoticeDate:D(t.secondNoticeDate||""),noticeDate:D(t.thirdNoticeDate||"")};default:return{}}})(),h=()=>{if(i)return i;switch(d){case"notice1":return e.jsxs("div",{className:"notice-body",children:[e.jsx("p",{className:"font-bold underline",children:"বিষয় : বাংলাদেশ শ্রম আইন ২০০৬ এর ২৭ (৩ক) ধারা মোতাবেক ব্যাখ্যা প্রদান সহ চাকুরীতে যোগদানের জন্য নোটিশ।"}),e.jsx("p",{children:"জনাব/জনাবা,"}),e.jsxs("p",{className:"text-justify",children:["আপনি গত ",e.jsx("span",{className:"font-bold underline",children:c.absenceDate})," ইং তারিখ থেকে কারখানা কর্তৃপক্ষের বিনা অনুমতিতে কর্মস্থলে অনুপস্থিত রয়েছেন। আপনার এরূপ অনুপস্থিতি বাংলাদেশ শ্রম আইন ২০০৬ এর ২৭ (৩ক) ধারার আওতায় পড়ে।"]}),e.jsx("p",{className:"text-justify",children:"সুতরাং অত্র পত্র প্রাপ্তির ১০ (দশ) দিনের মধ্যে আপনার অনুপস্থিতির কারণ ব্যাখ্যা সহ কাজে যোগদানের জন্য আপনাকে নির্দেশ দেয়া হলো।"}),e.jsx("p",{className:"text-justify",children:"আপনার লিখিত জবাব উক্ত সময়ের মধ্যে নিম্নস্বাক্ষরকারীর নিকট অবশ্যই পৌঁছাতে হবে। অন্যথায় কর্তৃপক্ষ আপনার বিরুদ্ধে প্রয়োজনীয় আইনানুগ ব্যবস্থা নিতে বাধ্য হবে।"})]});case"notice2":return e.jsxs("div",{className:"notice-body",children:[e.jsx("p",{className:"font-bold underline",children:"বিষয় : বাংলাদেশ শ্রম আইন ২০০৬ এর ২৭ (৩ক) ধারা মোতাবেক আত্মপক্ষ সমর্থনের সুযোগ প্রদান প্রসঙ্গে।"}),e.jsx("p",{children:"জনাব/জনাবা,"}),e.jsxs("p",{className:"text-justify",children:["আপনি গত ",e.jsx("span",{className:"font-bold underline",children:c.absenceDate})," ইং তারিখ থেকে কারখানা কর্তৃপক্ষের বিনা অনুমতিতে কর্মস্থলে অনুপস্থিত রয়েছেন। এ প্রেক্ষিতে কারখানা কর্তৃপক্ষ আপনার স্থায়ী ও বর্তমান ঠিকানায় রেজিস্ট্রি ডাকযোগে গত ",e.jsx("span",{className:"font-bold underline",children:c.firstNoticeDate})," ইং তারিখে বিনানুমতিতে চাকুরীতে অনুপস্থিতির কারণ ব্যাখ্যা সহ কাজে যোগদানের জন্য পত্র প্রেরণ করা হয়। কিন্তু অদ্যবধি আপনি উপরোক্ত বিষয়ে কোন ধরণের লিখিত ব্যাখ্যা প্রদান করেন নাই অথবা চাকুরীতেও যোগদান করেন নাই।"]}),e.jsx("p",{className:"text-justify",children:"অতএব, অত্র পত্র প্রাপ্তির ০৭ (সাত) দিনের মধ্যে আত্মপক্ষ সমর্থন সহ কাজে যোগদান করিতে আপনাকে নির্দেশ দেয়া গেল।"}),e.jsx("p",{className:"text-justify",children:"উক্ত সময়ের মধ্যে আপনি আত্মপক্ষ সমর্থনের জবাব সহ কাজে যোগদান করতে ব্যর্থ হলে বাংলাদেশ শ্রম আইন ২০০৬ এর ২৭ (৩ক) ধারা অনুযায়ী আপনি স্বেচ্ছায় চাকুরী থেকে ইস্তফা গ্রহণ করেছেন বলে গণ্য হবে।"})]});case"notice3":return e.jsxs("div",{className:"notice-body",children:[e.jsx("p",{className:"font-bold underline",children:"বিষয় : বাংলাদেশ শ্রম আইন ২০০৬ এর ২৭ (৩ক) ধারা মোতাবেক শ্রমিক কর্তৃক স্বেচ্ছায় চাকুরী হইতে ইস্তফা প্রসঙ্গে।"}),e.jsx("p",{children:"জনাব/জনাবা,"}),e.jsxs("p",{className:"text-justify",children:["আপনি গত ",e.jsx("span",{className:"font-bold underline",children:c.absenceDate})," ইং তারিখ হতে অদ্যবধি পর্যন্ত কর্তৃপক্ষের বিনা অনুমতিতে কর্মস্থলে অনুপস্থিত থাকার আপনাকে গত ",e.jsx("span",{className:"font-bold underline",children:c.firstNoticeDate})," ইং তারিখে একটি পত্রের মাধ্যমে ১০ (দশ) দিনের সময় দিয়ে চাকুরীতে যোগদান সহ ব্যাখ্যা প্রদান করতে বলা হয়েছিল। কিন্তু আপনি নির্ধারিত সময়ের মধ্যে কর্মস্থলে উপস্থিত হননি এবং কোন ব্যাখ্যা প্রদান করেননি।"]}),e.jsxs("p",{className:"text-justify",children:["তথাপি কর্তৃপক্ষ গত ",e.jsx("span",{className:"font-bold underline",children:c.secondNoticeDate})," ইং তারিখে আর একটি পত্রের মাধ্যমে আপনাকে আরো ৭ (সাত) দিনের সময় দিয়ে আত্মপক্ষ সমর্থন সহ চাকুরীতে যোগদানের জন্য পুনরায় নির্দেশ প্রদান করেন। তৎসত্ত্বেও আপনি নির্ধারিত সময়ের মধ্যে আত্মপক্ষ করেননি এবং যোগদান করেননি।"]}),e.jsx("p",{className:"text-justify",children:"সুতরাং বাংলাদেশ শ্রম আইন, ২০০৬ এর ২৭ (৩ক) ধারা অনুযায়ী অনুপস্থিত দিন থেকে আপনি চাকুরী হতে স্বেচ্ছায় ইস্তফা গ্রহণ করেছেন বলে গণ্য করা হলো।"}),e.jsx("p",{className:"text-justify",children:"অতএব, আপনার বকেয়া মজুরী ও আইনানুগ পাওনা (যদি থাকে) যে কোন কর্মদিবসে অফিস চলাকালীন সময়ে কারখানার হিসাব শাখা থেকে গ্রহণ করার জন্য নির্দেশ দেয়া গেল।"})]});default:return null}};return e.jsxs("div",{className:"notice-page",children:[e.jsxs("div",{className:"notice-content",children:[(t.companyName||t.companyAddress)&&e.jsxs("div",{className:"notice-company",children:[t.companyName&&e.jsx("h1",{className:"notice-company-name",children:t.companyName}),t.companyAddress&&e.jsx("p",{className:"notice-company-address",children:t.companyAddress})]}),e.jsx("h2",{className:"notice-title",children:'"রেজিস্টার্ড ডাকযোগে প্রেরিত"'}),c.noticeDate&&e.jsxs("div",{className:"notice-date-row",children:[e.jsxs("span",{className:"notice-type-label",children:["(",s,")"]}),e.jsxs("span",{className:"notice-date-label",children:["তারিখ: ",e.jsxs("strong",{children:[y(c.noticeDate)," ইং"]})]})]}),e.jsx("p",{className:"notice-to",children:"প্রতি,"}),e.jsxs("div",{className:"notice-emp-grid",children:[e.jsxs("div",{className:"notice-emp-col",children:[e.jsx("div",{className:"notice-emp-col-title",children:"ব্যক্তিগত তথ্য"}),e.jsxs("p",{children:[e.jsx("span",{children:"নাম:"})," ",t.name||"-"]}),e.jsxs("p",{children:[e.jsx("span",{children:"পিতার নাম:"})," ",t.fatherName||"-"]}),t.motherName&&e.jsxs("p",{children:[e.jsx("span",{children:"মাতার নাম:"})," ",t.motherName]}),e.jsxs("p",{children:[e.jsx("span",{children:"পদবী:"})," ",t.designation||"-"]}),e.jsxs("p",{children:[e.jsx("span",{children:"কার্ড নং:"})," ",t.cardNo||"-"]}),e.jsxs("p",{children:[e.jsx("span",{children:"সেকশন:"})," ",t.section||"-"]}),t.joiningDate&&e.jsxs("p",{children:[e.jsx("span",{children:"যোগদান:"})," ",D(t.joiningDate)]})]}),e.jsxs("div",{className:"notice-emp-col",children:[e.jsx("div",{className:"notice-emp-col-title",children:"বর্তমান ঠিকানা"}),t.presentAddress.houseNo&&e.jsxs("p",{children:["বাড়ি: ",t.presentAddress.houseNo]}),t.presentAddress.village&&e.jsxs("p",{children:["গ্রাম: ",t.presentAddress.village]}),t.presentAddress.postOffice&&e.jsxs("p",{children:["ডাকঘর: ",t.presentAddress.postOffice]}),t.presentAddress.thana&&e.jsxs("p",{children:["থানা: ",t.presentAddress.thana]}),t.presentAddress.district&&e.jsxs("p",{children:["জেলা: ",t.presentAddress.district]})]}),e.jsxs("div",{className:"notice-emp-col",children:[e.jsx("div",{className:"notice-emp-col-title",children:"স্থায়ী ঠিকানা"}),t.permanentAddress.houseNo&&e.jsxs("p",{children:["বাড়ি: ",t.permanentAddress.houseNo]}),t.permanentAddress.village&&e.jsxs("p",{children:["গ্রাম: ",t.permanentAddress.village]}),t.permanentAddress.postOffice&&e.jsxs("p",{children:["ডাকঘর: ",t.permanentAddress.postOffice]}),t.permanentAddress.thana&&e.jsxs("p",{children:["থানা: ",t.permanentAddress.thana]}),t.permanentAddress.district&&e.jsxs("p",{children:["জেলা: ",t.permanentAddress.district]})]})]}),e.jsx("div",{className:"notice-body-wrap",children:h()}),d&&e.jsxs("div",{className:"notice-copy",children:[e.jsx("p",{className:"font-bold underline",children:"অনুলিপি:"}),e.jsx("ol",{children:N.map((r,u)=>e.jsxs("li",{children:[e.jsxs("span",{children:[y(String(u+1)),"."]})," ",r]},u))})]}),d&&e.jsx("div",{className:"notice-authority",children:e.jsx("p",{className:"font-bold",children:"কর্তৃপক্ষের নির্দেশক্রমে"})}),d&&p&&e.jsx("div",{className:"notice-sig",children:e.jsx(G,{value:p,lang:"bn",hidePrepared:!0,hideTopBorder:!0})})]}),e.jsx("style",{children:`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap');

        /* ── Screen styles ─────────────────────────────────────── */
        .notice-page {
          font-family: 'Noto Sans Bengali', 'Noto Sans', Arial, sans-serif;
          max-width: 210mm;
          margin: 0 auto;
          background: #fff;
          padding: 24px 32px;
          box-shadow: 0 2px 16px rgba(0,0,0,0.08);
          border-radius: 8px;
        }
        .notice-content { font-size: 14px; line-height: 1.7; color: #111; }
        .notice-company { text-align: center; border-bottom: 2px solid #1d4ed8; padding-bottom: 10px; margin-bottom: 10px; }
        .notice-company-name { font-size: 18px; font-weight: 700; color: #1e3a5f; margin-bottom: 2px; }
        .notice-company-address { font-size: 13px; color: #374151; }
        .notice-title { text-align: center; font-size: 16px; font-weight: 700; text-decoration: underline; margin: 8px 0; }
        .notice-date-row { display: flex; justify-content: flex-end; gap: 12px; font-size: 13px; margin-bottom: 6px; flex-wrap: wrap; }
        .notice-type-label { color: #1d4ed8; font-weight: 600; }
        .notice-date-label { color: #374151; }
        .notice-to { font-weight: 600; margin: 4px 0; }
        .notice-emp-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin: 8px 0; }
        .notice-emp-col { font-size: 12.5px; line-height: 1.55; }
        .notice-emp-col-title { font-weight: 700; font-size: 13px; border-bottom: 1.5px solid #111; padding-bottom: 3px; margin-bottom: 4px; }
        .notice-emp-col p { margin: 1px 0; }
        .notice-emp-col span { font-weight: 600; }
        .notice-body-wrap { margin: 10px 0; }
        .notice-body { display: flex; flex-direction: column; gap: 8px; font-size: 13.5px; }
        .notice-body p { margin: 0; line-height: 1.65; }
        .notice-copy { margin-top: 10px; font-size: 13px; }
        .notice-copy ol { list-style: none; padding: 0; margin: 4px 0; }
        .notice-copy li { display: flex; gap: 6px; margin: 2px 0; }
        .notice-authority { margin-top: 12px; font-size: 13px; }
        .notice-sig { margin-top: 4px; }

        /* ── Print styles — force single A4 page ──────────────── */
        ${$}

        @media print {
          @page {
            size: A4 portrait;
            margin: 14mm 16mm 14mm 16mm;
          }

          /* Hide everything except the notice */
          body * { visibility: hidden !important; }
          .notice-page,
          .notice-page * { visibility: visible !important; }

          /* Reset screen decorations */
          .notice-page {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: white !important;
          }

          /* ── Single-page enforcement ─────────────────────────
             The entire notice-content is treated as one atomic
             block — page-break-inside: avoid forces the browser /
             print engine to never split it across pages.
             Combined with compact font/spacing below, everything
             fits on one A4 sheet for all three notice types.    */
          .notice-content {
            font-size: 9.5pt !important;
            line-height: 1.45 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .notice-company {
            border-bottom: 1.5pt solid #000 !important;
            padding-bottom: 5pt !important;
            margin-bottom: 5pt !important;
          }
          .notice-company-name { font-size: 13pt !important; color: #000 !important; margin-bottom: 1pt !important; }
          .notice-company-address { font-size: 9pt !important; color: #000 !important; }

          .notice-title { font-size: 11pt !important; margin: 4pt 0 !important; }

          .notice-date-row { font-size: 9pt !important; margin-bottom: 3pt !important; }
          .notice-type-label { color: #000 !important; }

          .notice-to { margin: 2pt 0 !important; }

          /* Employee info grid — always 3 columns in print */
          .notice-emp-grid {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 6pt !important;
            margin: 5pt 0 !important;
          }
          .notice-emp-col { font-size: 8.5pt !important; line-height: 1.4 !important; }
          .notice-emp-col-title { font-size: 9pt !important; padding-bottom: 2pt !important; margin-bottom: 3pt !important; }
          .notice-emp-col p { margin: 0 !important; }

          .notice-body-wrap { margin: 6pt 0 !important; }
          .notice-body { gap: 5pt !important; font-size: 9.5pt !important; }
          .notice-body p { line-height: 1.5 !important; }

          .notice-copy { margin-top: 6pt !important; font-size: 9pt !important; }
          .notice-copy ol { margin: 2pt 0 !important; }
          .notice-copy li { margin: 1pt 0 !important; }

          .notice-authority { margin-top: 8pt !important; font-size: 9pt !important; }
          .notice-sig { margin-top: 2pt !important; }

          /* Keep signature block together with authority line */
          .notice-authority,
          .notice-sig {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `})]})};function M({employee:t,address:s,addressLabel:i}){const n=L(),p=[s.houseNo,s.village,s.postOffice,s.thana,s.district].filter(Boolean).join(", ");return e.jsx("div",{className:"envelope-container",children:e.jsxs("div",{className:"envelope",children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start"},children:[e.jsxs("div",{style:{maxWidth:"55%"},children:[e.jsx("p",{style:{fontSize:"8pt",fontWeight:700,color:"#111827",margin:0,textDecoration:"underline"},children:"From"}),e.jsx("p",{style:{fontSize:"9pt",fontWeight:700,color:"#111827",margin:"3pt 0 0"},children:t.companyName||n.nameEn}),e.jsx("p",{style:{fontSize:"8pt",color:"#374151",margin:"1pt 0 0",lineHeight:1.35},children:t.companyAddress||"32, Lakshmipura, Chandana, Joydevpur, Gazipur-1700"})]}),e.jsx("div",{style:{width:"32mm",height:"18mm",flexShrink:0,border:"1px dashed #9ca3af",borderRadius:"2px",display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx("span",{style:{fontSize:"6.5pt",color:"#9ca3af"},children:"Postage / Stamp"})})]}),e.jsxs("div",{style:{marginTop:"14mm"},children:[e.jsx("p",{style:{fontSize:"10pt",fontWeight:700,color:"#111827",margin:0},children:"To"}),e.jsx("p",{style:{fontSize:"9pt",fontWeight:700,color:"#111827",margin:"5pt 0 3pt",textDecoration:"underline"},children:i}),e.jsx("p",{style:{fontSize:"11pt",fontWeight:700,color:"#111827",margin:"4pt 0 0"},children:t.name||"Employee Name"}),(t.fatherName||t.husbandName)&&e.jsx("p",{style:{fontSize:"8.5pt",color:"#1f2937",margin:"2pt 0 0"},children:t.fatherName?`son/daughter of ${t.fatherName}`:`wife of ${t.husbandName}`}),p&&e.jsx("p",{style:{fontSize:"9.5pt",color:"#1f2937",margin:"4pt 0 0",lineHeight:1.6,maxWidth:"85%"},children:p})]})]})})}const me=({employee:t,addressType:s="both"})=>{const i=s==="present"||s==="both",n=s==="permanent"||s==="both";return e.jsxs("div",{className:"envelope-page",children:[i&&e.jsx(M,{employee:t,address:t.presentAddress,addressLabel:"বর্তমান ঠিকানা (Present Address)"}),n&&e.jsx(M,{employee:t,address:t.permanentAddress,addressLabel:"স্থায়ী ঠিকানা (Permanent Address)"}),e.jsx("style",{children:`
        ${$}
        ${T}

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
      `})]})},he=[{id:"personal",label:"সাধারণ তথ্য",icon:"ti-user-circle"},{id:"address",label:"ঠিকানা",icon:"ti-map-pin"}];function R(t,s){let i={};try{i=JSON.parse(String(t.addressesJson??"{}"))??{}}catch{}return{...s,name:String(t.employeeName??""),fatherName:String(t.fatherName??""),motherName:String(t.motherName??""),gender:String(t.gender??""),husbandName:String(t.husbandName??""),cardNo:String(t.cardNo??""),designation:String(t.designation??""),section:String(t.department??""),date:w(t.date),joiningDate:w(t.joiningDate),absenceStartDate:w(t.absentFrom),firstNoticeDate:w(t.firstNoticeDate),secondNoticeDate:w(t.secondNoticeDate),thirdNoticeDate:w(t.thirdNoticeDate),presentAddress:i.present??s.presentAddress,permanentAddress:i.permanent??s.permanentAddress}}function ve(){const t=L(),{user:s}=_(),i=U("leftnotice",t.id,s?.name??"unknown"),n=b.useRef(null),[p,d]=b.useState(K),[N,o]=b.useState(!1),[c,h]=b.useState("personal"),[r,u]=b.useState(C);b.useEffect(()=>{u(a=>({...a,companyName:t.nameBn,companyAddress:t.addressBn,date:a.date||new Date().toISOString().split("T")[0]}))},[t.id]);const A=!!(r.name&&r.cardNo&&r.companyName),j=!!r.absenceStartDate,m=()=>{o(!1),u(a=>({...C,companyName:a.companyName,companyAddress:a.companyAddress})),h("personal"),i.setEditingId(null)},v=()=>window.print(),S=async()=>{const a=n.current;a&&await J({element:a,filename:`LeftNotice_${r.name||"document"}`,scale:2})},F=()=>({employeeName:r.name,cardNo:r.cardNo,designation:r.designation,department:r.section,fatherName:r.fatherName??"",motherName:r.motherName??"",gender:r.gender??"",husbandName:r.husbandName??"",date:r.date??"",joiningDate:r.joiningDate??"",absentFrom:r.absenceStartDate??"",firstNoticeDate:r.firstNoticeDate??"",secondNoticeDate:r.secondNoticeDate??"",thirdNoticeDate:r.thirdNoticeDate??"",noticeType:"notice1",addressesJson:JSON.stringify({present:r.presentAddress,permanent:r.permanentAddress})}),Y=[{label:"পত্র নং-১",onClick:()=>j&&h("notice1")},{label:"পত্র নং-২",onClick:()=>j&&h("notice2")},{label:"পত্র নং-৩",onClick:()=>j&&h("notice3")},{label:"খাম",onClick:()=>{},subItems:[{label:"বর্তমান ঠিকানা",onClick:()=>j&&h("envelope-present"),active:c==="envelope-present"},{label:"স্থায়ী ঠিকানা",onClick:()=>j&&h("envelope-permanent"),active:c==="envelope-permanent"}]}],V=c!=="personal"&&c!=="address",H=c==="personal"||c==="address"?c:"personal";return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`
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

        ${$}${T}

        @media print {
          @page { size: A4 portrait; margin: 25mm 20mm 20mm 25mm; }
          body { font-family: 'Noto Sans Bengali', Arial, sans-serif !important; }
          .print-content, .print-content * {
            font-family: 'Noto Sans Bengali', Arial, sans-serif !important;
            color: #000 !important;
          }
        }
      `}),e.jsxs(Z,{moduleName:"কর্মী অনুপস্থিতি নোটিশ",moduleNameEn:"Left Worker Notice",date:r.date,onDateChange:a=>u(l=>({...l,date:a})),steps:he,activeStep:H,onStepChange:a=>h(a),billItems:Y,isBillActive:V,onSave:async()=>{const a=F(),l=i.editingId?await i.update(i.editingId,a):await i.save(a);return l&&m(),l},isSaving:i.isSaving,configured:i.configured,adapterName:i.adapterName,saveDisabled:!A,editingId:i.editingId,onCancelEdit:m,isDirty:N,onReset:m,onUpdate:a=>{i.setEditingId(String(a.id??"")),u(l=>R(a,l)),h("personal")},updateModule:"leftnotice",updateLabel:"Left Notice রেকর্ড খুঁজুন",updateSearchPlaceholder:"নাম, কার্ড নং বা পদবী দিয়ে খুঁজুন...",onEmployeeSelect:a=>{u(l=>({...l,name:String(a.fullNameBengali??a.fullName??l.name),fatherName:String(a.fatherName??l.fatherName),motherName:String(a.motherName??l.motherName??""),gender:String(a.gender??l.gender??""),designation:String(a.designation??l.designation),cardNo:String(a.cardNo??l.cardNo),section:String(a.sectionLine??a.department??l.section),joiningDate:String(a.joiningDate??l.joiningDate??""),presentAddress:{houseNo:String(a.presentHouseNo??l.presentAddress.houseNo),village:String(a.presentVillage??l.presentAddress.village),postOffice:String(a.presentPostOffice??l.presentAddress.postOffice),thana:String(a.presentThana??l.presentAddress.thana),district:String(a.presentDistrict??l.presentAddress.district)},permanentAddress:{houseNo:String(a.permanentHouseNo??l.permanentAddress.houseNo),village:String(a.permanentVillage??l.permanentAddress.village),postOffice:String(a.permanentPostOffice??l.permanentAddress.postOffice),thana:String(a.permanentThana??l.permanentAddress.thana),district:String(a.permanentDistrict??l.permanentAddress.district)}})),o(!0)},calcRows:[{label:"১ম নোটিশ",value:r.firstNoticeDate?y(r.firstNoticeDate.split("-").reverse().join("/")):"—"},{label:"২য় নোটিশ",value:r.secondNoticeDate?y(r.secondNoticeDate.split("-").reverse().join("/")):"—"},{label:"চূড়ান্ত নোটিশ",value:r.thirdNoticeDate?y(r.thirdNoticeDate.split("-").reverse().join("/")):"—"}],records:i.records,isLoading:i.isLoading,onLoadRecord:a=>{i.setEditingId(String(a.id??"")),u(l=>R(a,l)),h("personal"),window.scrollTo({top:0,behavior:"smooth"})},onDeleteRecord:i.remove,onReload:i.reload,auth:p,onAuthChange:d,onPrint:v,onPDF:S,lang:"bn",children:[(c==="personal"||c==="address")&&e.jsx(e.Fragment,{children:e.jsx(le,{employee:r,onChange:a=>{o(!0),u(a)},activeTab:c,onDirtyChange:a=>{a&&o(!0)}},i.editingId??"new")}),(c==="envelope-present"||c==="envelope-permanent")&&e.jsx("div",{id:"printable-area",ref:n,children:e.jsx(me,{employee:r,addressType:c==="envelope-present"?"present":"permanent"})}),["notice1","notice2","notice3"].map((a,l)=>c===a&&e.jsx("div",{id:"printable-area",ref:n,children:e.jsx(pe,{employee:r,title:`পত্র নং-${y(l+1)}`,noticeType:a,authorization:p})},a))]})]})}export{ve as default};
