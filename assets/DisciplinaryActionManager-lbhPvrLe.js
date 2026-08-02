import{r as w,j as e,R as Ae,u as $e,b as _e,e as Fe}from"./index-Bqov6j6O.js";import{u as Ie}from"./useDatabase-oaDwCbJb.js";import{P as Be,D as Oe,M as Le,t as H}from"./ModuleShell-CBTpfY33.js";import{t as L,f as Pe}from"./bnEnDate-DcYhykOO.js";import{B as ae,P as We}from"./printCSS-BUl_02G7.js";import"./DatabaseFactory-CZ9gIitu.js";import"./AuthorityIconButton-BnoikO-1.js";import"./DataUseCases-CYw5HKY7.js";const He=5;function Ge(t){return/^\d{4}-\d{2}-\d{2}$/.test(t)}function Ue(t,n=[]){const s=new Date(t);return isNaN(s.getTime())?!1:s.getDay()===He?!0:n.some(i=>Ge(i)&&i===t)}function le(t,n,s=[]){if(!t)return"";const i=new Date(t);if(isNaN(i.getTime()))return"";const r=new Date(i);for(r.setDate(r.getDate()+n);Ue(r.toISOString().split("T")[0],s);)r.setDate(r.getDate()+1);return r.toISOString().split("T")[0]}function S(t){return t?L(Pe(t)):""}const ze=["কারণ দর্শানোর নোটিশ।","অস্থায়ী স্থগিতাদেশ সহ কারণ দর্শানোর নোটিশ।"];function Ye(t){return{slNo:t,name:"",cardNo:"",designation:"",section:""}}function se(){return{referenceNo:"",employeeName:"",cardNo:"",designation:"",section:"",joiningDate:"",showCauseDate:"",subject:"কারণ দর্শানোর নোটিশ।",complaint:"",replyDate:"",replyStatus:"",numberOfCommitteeMembers:"",notice2Date:"",committeeMembers:[],notice3Date:"",investigationReportSummary:"",recommendation:"",finalDecision:"",evaluationDate:"",punishmentType:"",date:new Date().toISOString().split("T")[0],factoryName:"",factoryAddress:""}}se();function Te(t){return t<=0?0:Math.ceil(t/2)}function qe(t,n,s){const i=String(n+1).padStart(3,"0");return`${t||"কোম্পানি"}/এইচ.আর./ডি/${L(i)}/${s}`}function Ke(t,n){const s=Math.max(0,n),i=[];for(let r=0;r<s;r++)i.push(t[r]?{...t[r],slNo:r+1}:Ye(r+1));return i}function ce(t,n){return t?le(t,1,n):""}function Ee(t){return t?/<\/?(div|p|ul|ol|li|b|strong|i|em|u|s|strike|sub|sup|span|br)\b[^>]*>/i.test(t):!1}const Xe=new Set(["B","STRONG","I","EM","U","S","STRIKE","SUB","SUP","SPAN","DIV","P","BR","UL","OL","LI"]);function Re(t){const n=Array.from(t.childNodes);for(const s of n)if(s.nodeType===Node.ELEMENT_NODE){const i=s;if(!Xe.has(i.tagName)){for(;i.firstChild;)t.insertBefore(i.firstChild,i);t.removeChild(i);continue}Array.from(i.attributes).forEach(r=>{if(i.tagName==="SPAN"&&r.name==="style"){const a=i.style.fontSize;i.removeAttribute("style"),a&&(i.style.fontSize=a)}else if(i.tagName==="OL"&&r.name==="data-num"){const a=i.getAttribute("data-num");a!=="bn"&&a!=="en"&&i.removeAttribute("data-num")}else i.removeAttribute(r.name)}),Re(i)}else s.nodeType!==Node.TEXT_NODE&&t.removeChild(s)}function re(t){const n=document.createElement("div");return n.innerHTML=t,Re(n),n.innerHTML}function Je(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function ee(t){let n=Je(t);return n=n.replace(/\*\*\*(.+?)\*\*\*/g,"<strong><em>$1</em></strong>"),n=n.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>"),n=n.replace(/\*(.+?)\*/g,"<em>$1</em>"),n}function Ve(t){if(!t)return"<div><br></div>";const n=t.split(`
`),s=[];let i=0;for(;i<n.length;){const r=n[i],a=r.match(/^\s*•\s+(.*)$/),c=r.match(/^\s*\d+\.\s+(.*)$/);if(a){const h=[];for(;i<n.length&&n[i].match(/^\s*•\s+(.*)$/);)h.push(n[i].match(/^\s*•\s+(.*)$/)[1]),i++;s.push("<ul>"+h.map(l=>`<li>${ee(l)}</li>`).join("")+"</ul>");continue}if(c){const h=[];for(;i<n.length&&n[i].match(/^\s*\d+\.\s+(.*)$/);)h.push(n[i].match(/^\s*\d+\.\s+(.*)$/)[1]),i++;s.push("<ol>"+h.map(l=>`<li>${ee(l)}</li>`).join("")+"</ol>");continue}s.push(r.trim()===""?"<div><br></div>":`<div>${ee(r)}</div>`),i++}return s.join("")}const de="'Noto Sans Bengali', Arial, sans-serif",Ze=9,Qe=28,et=13,me=2,E={minWidth:28,height:28,padding:"0 6px",display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid #cbd5e1",background:"#fff",borderRadius:6,cursor:"pointer",fontSize:12.5,fontWeight:700,color:"#1e293b",fontFamily:de,lineHeight:1},he={width:1,alignSelf:"stretch",background:"#e2e8f0",margin:"0 2px"};function V({value:t,onChange:n,rows:s=5,placeholder:i,style:r}){const a=w.useRef(null),c=w.useRef(""),h=w.useRef(!1);w.useEffect(()=>{if(!a.current||h.current&&t===c.current)return;const m=t?Ee(t)?re(t):Ve(t):"<div><br></div>";a.current.innerHTML=m,c.current=t,h.current=!0;try{document.execCommand("defaultParagraphSeparator",!1,"div")}catch{}},[t]);const l=w.useCallback(()=>{if(!a.current)return;const m=re(a.current.innerHTML);c.current=m,n(m)},[n]),f=m=>{a.current?.focus(),document.execCommand(m,!1),l()},o=m=>u=>{u.preventDefault(),m()},g=m=>{const u=document.createRange();u.selectNodeContents(m),u.collapse(!1);const d=window.getSelection();d?.removeAllRanges(),d?.addRange(u)},A=m=>{const u=m.parentElement,d=Array.from(u.children),x=d.indexOf(m);return{before:d.slice(0,x),after:d.slice(x+1),listTag:u.tagName,listNum:u.getAttribute("data-num")}},y=(m,u,d)=>{const x=document.createElement(m);return m==="OL"&&d&&x.setAttribute("data-num",d),u.forEach(b=>x.appendChild(b)),x},j=m=>{const u=a.current;if(!u)return;u.focus();const d=window.getSelection();if(!d||d.rangeCount===0)return;const x=m==="bullet"?"ul":"ol",b=m==="ol-bn"?"bn":m==="ol-en"?"en":null;let k=d.getRangeAt(0).startContainer;for(;k&&k.parentNode!==u;)k=k.parentNode;if(!k)return;const _=k,R=_.tagName?.toLowerCase();if(R==="div"||R==="p"){const N=document.createElement("li");N.innerHTML=_.innerHTML||"<br>";const Me=y(x.toUpperCase(),[N],b);_.replaceWith(Me),g(N),l();return}if(R!=="ul"&&R!=="ol")return;let M=d.getRangeAt(0).startContainer;for(;M&&M.tagName!=="LI";)M=M.parentNode;if(!M)return;const D=M,F=R,W=F==="ol"?D.parentElement.getAttribute("data-num"):null;if(F==="ol"&&x==="ol"&&W!==b){D.parentElement.setAttribute("data-num",b||"en"),l();return}const{before:p,after:v,listTag:z,listNum:T}=A(D),I=document.createDocumentFragment();if(p.length&&I.appendChild(y(z,p,T)),F===x&&(F!=="ol"||W===b)){const N=document.createElement("div");N.innerHTML=D.innerHTML||"<br>",I.appendChild(N),v.length&&I.appendChild(y(z,v,T)),D.parentElement.replaceWith(I),g(N)}else{const N=document.createElement("li");N.innerHTML=D.innerHTML||"<br>",I.appendChild(y(x.toUpperCase(),[N],b)),v.length&&I.appendChild(y(z,v,T)),D.parentElement.replaceWith(I),g(N)}l()},C=m=>{const u=a.current;if(!u)return;u.focus();const d=window.getSelection();if(!d||d.rangeCount===0||d.isCollapsed)return;const x=d.getRangeAt(0);if(!u.contains(x.commonAncestorContainer))return;const b=x.startContainer,k=b.nodeType===Node.ELEMENT_NODE?b:b.parentElement;let _=et;const R=k?.closest('span[style*="font-size"]');if(R){const p=parseInt(R.style.fontSize,10);Number.isNaN(p)||(_=p)}const M=Math.min(Qe,Math.max(Ze,_+m)),D=document.createElement("span");D.style.fontSize=`${M}px`;const F=x.extractContents();D.appendChild(F),x.insertNode(D);const W=document.createRange();W.selectNodeContents(D),d.removeAllRanges(),d.addRange(W),l()},$=!t||t.trim()===""||t==="<div><br></div>";return e.jsxs("div",{children:[e.jsxs("div",{style:{display:"flex",alignItems:"stretch",gap:4,marginBottom:6,flexWrap:"wrap"},children:[e.jsx("button",{type:"button",title:"Bold",style:E,onMouseDown:o(()=>f("bold")),children:"B"}),e.jsx("button",{type:"button",title:"Italic",style:{...E,fontStyle:"italic"},onMouseDown:o(()=>f("italic")),children:"I"}),e.jsx("button",{type:"button",title:"Underline",style:{...E,textDecoration:"underline"},onMouseDown:o(()=>f("underline")),children:"U"}),e.jsx("button",{type:"button",title:"Strikethrough",style:{...E,textDecoration:"line-through"},onMouseDown:o(()=>f("strikeThrough")),children:"S"}),e.jsxs("button",{type:"button",title:"Subscript",style:E,onMouseDown:o(()=>f("subscript")),children:["x",e.jsx("sub",{children:"2"})]}),e.jsxs("button",{type:"button",title:"Superscript",style:E,onMouseDown:o(()=>f("superscript")),children:["x",e.jsx("sup",{children:"2"})]}),e.jsxs("button",{type:"button",title:"Clear formatting",style:{...E,textDecoration:"line-through"},onMouseDown:o(()=>f("removeFormat")),children:["T",e.jsx("sub",{style:{fontSize:9},children:"x"})]}),e.jsx("div",{style:he}),e.jsx("button",{type:"button",title:"Bullet list",style:E,onMouseDown:o(()=>j("bullet")),children:"• ≡"}),e.jsx("button",{type:"button",title:"বাংলা সংখ্যা তালিকা",style:E,onMouseDown:o(()=>j("ol-bn")),children:"১ ≡"}),e.jsx("button",{type:"button",title:"English numbered list",style:E,onMouseDown:o(()=>j("ol-en")),children:"1 ≡"}),e.jsx("div",{style:he}),e.jsxs("button",{type:"button",title:"Decrease font size",style:E,onMouseDown:o(()=>C(-me)),children:["A",e.jsx("span",{style:{fontSize:10},children:"-"})]}),e.jsxs("button",{type:"button",title:"Increase font size",style:E,onMouseDown:o(()=>C(me)),children:["A",e.jsx("span",{style:{fontSize:15},children:"+"})]})]}),e.jsxs("div",{style:{position:"relative"},children:[$&&i&&e.jsx("div",{style:tt,children:i}),e.jsx("div",{ref:a,contentEditable:!0,suppressContentEditableWarning:!0,onInput:l,onBlur:l,className:"rta-editable",style:{minHeight:s*22,width:"100%",padding:"9px 12px",border:"1px solid #cbd5e1",borderRadius:8,fontSize:13,fontFamily:de,background:"#fff",color:"#1e293b",outline:"none",boxSizing:"border-box",lineHeight:1.7,overflowY:"auto",...r}}),e.jsx("style",{children:`
          @counter-style rta-bn-num {
            system: numeric;
            symbols: "০" "১" "২" "৩" "৪" "৫" "৬" "৭" "৮" "৯";
            suffix: ". ";
          }
          .rta-editable div { min-height: 1.2em; }

          .rta-editable ul { list-style: none; margin: 0 0 8px; padding-left: 0; }
          .rta-editable ul > li { position: relative; padding-left: 20px; margin-bottom: 3px; }
          .rta-editable ul > li::before { content: "•"; position: absolute; left: 4px; }

          .rta-editable ol { list-style: none; counter-reset: rta-num; margin: 0 0 8px; padding-left: 0; }
          .rta-editable ol > li { counter-increment: rta-num; position: relative; padding-left: 28px; margin-bottom: 3px; }
          .rta-editable ol > li::before { content: counter(rta-num) ". "; position: absolute; left: 0; }
          .rta-editable ol[data-num="bn"] > li::before { content: counter(rta-num, rta-bn-num); }
        `})]})]})}const tt={position:"absolute",top:9,left:12,right:12,color:"#94a3b8",fontSize:13,fontFamily:de,lineHeight:1.7,pointerEvents:"none"},Z="'Noto Sans Bengali', Arial, sans-serif",B={fontSize:13,fontWeight:600,fontFamily:Z,color:"#1e293b",display:"block",marginBottom:6},G={width:"100%",padding:"9px 12px",border:"1px solid #cbd5e1",borderRadius:8,fontSize:13,fontFamily:Z,background:"#fff",color:"#1e293b",outline:"none",boxSizing:"border-box"},O={marginBottom:16},nt={padding:"9px 16px",background:"#1e3a5f",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:Z};function it({data:t,setData:n,onGenerateNotice:s}){const i=(a,c)=>n({...t,[a]:c}),r=!!(t.employeeName&&t.cardNo&&t.complaint&&t.showCauseDate);return e.jsxs("div",{style:{background:"#fff",borderRadius:10,border:"1px solid #e2e8f0",padding:20},children:[e.jsxs("div",{style:{marginBottom:16,padding:"10px 14px",background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:8,fontSize:12.5,fontFamily:Z,color:"#475569"},children:["সূত্র নংঃ ",e.jsx("b",{children:t.referenceNo||"সংরক্ষণের পর স্বয়ংক্রিয়ভাবে তৈরি হবে"})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(2, 1fr)",gap:16},children:[e.jsxs("div",{style:O,children:[e.jsx("label",{style:B,children:"কারণ দর্শানোর তারিখ *"}),e.jsx("input",{type:"date",value:t.showCauseDate,onChange:a=>i("showCauseDate",a.target.value),style:G}),t.showCauseDate&&e.jsxs("div",{style:{fontSize:11,color:"#64748b",marginTop:3},children:[S(t.showCauseDate)," ইং"]})]}),e.jsxs("div",{style:O,children:[e.jsx("label",{style:B,children:"কর্মীর নাম *"}),e.jsx("input",{value:t.employeeName,onChange:a=>i("employeeName",a.target.value),style:G})]}),e.jsxs("div",{style:O,children:[e.jsx("label",{style:B,children:"কার্ড নং *"}),e.jsx("input",{value:t.cardNo,onChange:a=>i("cardNo",a.target.value),style:G})]}),e.jsxs("div",{style:O,children:[e.jsx("label",{style:B,children:"পদবী"}),e.jsx("input",{value:t.designation,onChange:a=>i("designation",a.target.value),style:G})]}),e.jsxs("div",{style:O,children:[e.jsx("label",{style:B,children:"সেকশন"}),e.jsx("input",{value:t.section,onChange:a=>i("section",a.target.value),style:G})]}),e.jsxs("div",{style:O,children:[e.jsx("label",{style:B,children:"যোগদানের তারিখ"}),e.jsx("input",{type:"date",value:t.joiningDate,onChange:a=>i("joiningDate",a.target.value),style:G})]}),e.jsxs("div",{style:O,children:[e.jsx("label",{style:B,children:"বিষয় *"}),e.jsx("select",{value:t.subject,onChange:a=>i("subject",a.target.value),style:G,children:ze.map(a=>e.jsx("option",{value:a,children:a},a))})]})]}),e.jsxs("div",{style:O,children:[e.jsx("label",{style:B,children:"অভিযোগ *"}),e.jsx(V,{value:t.complaint,onChange:a=>i("complaint",a),rows:4,placeholder:"যে অভিযোগের ভিত্তিতে এই নোটিশ জারি করা হচ্ছে তা লিখুন"})]}),e.jsx("button",{onClick:s,disabled:!r,style:{...nt,opacity:r?1:.5,cursor:r?"pointer":"not-allowed"},children:"🖨 নোটিশ ১ তৈরি করুন"})]})}const X="'Noto Sans Bengali', Arial, sans-serif",fe={fontSize:13,fontWeight:600,fontFamily:X,color:"#1e293b",display:"block",marginBottom:6},ot={width:"100%",padding:"9px 12px",border:"1px solid #cbd5e1",borderRadius:8,fontSize:13,fontFamily:X,background:"#fff",color:"#1e293b",outline:"none",boxSizing:"border-box"},ue={marginBottom:16,maxWidth:320};function st({data:t,setData:n}){const s=(r,a)=>n({...t,[r]:a}),i=t.replyStatus==="সন্তোষজনক";return e.jsxs("div",{style:{background:"#fff",borderRadius:10,border:"1px solid #e2e8f0",padding:20},children:[e.jsxs("div",{style:ue,children:[e.jsx("label",{style:fe,children:"জবাবের তারিখ"}),e.jsx("input",{type:"date",value:t.replyDate,onChange:r=>s("replyDate",r.target.value),style:ot})]}),e.jsx("div",{style:{marginBottom:8,...ue},children:e.jsx("label",{style:fe,children:"জবাবের অবস্থা"})}),e.jsxs("div",{style:{display:"flex",gap:12,maxWidth:420},children:[e.jsx("button",{onClick:()=>s("replyStatus","সন্তোষজনক"),style:{flex:1,padding:"14px",borderRadius:8,fontFamily:X,fontWeight:700,fontSize:13,cursor:"pointer",border:t.replyStatus==="সন্তোষজনক"?"2px solid #16a34a":"1px solid #cbd5e1",background:t.replyStatus==="সন্তোষজনক"?"#f0fdf4":"#fff",color:t.replyStatus==="সন্তোষজনক"?"#15803d":"#64748b"},children:"✓ সন্তোষজনক"}),e.jsx("button",{onClick:()=>s("replyStatus","অসন্তোষজনক"),style:{flex:1,padding:"14px",borderRadius:8,fontFamily:X,fontWeight:700,fontSize:13,cursor:"pointer",border:t.replyStatus==="অসন্তোষজনক"?"2px solid #dc2626":"1px solid #cbd5e1",background:t.replyStatus==="অসন্তোষজনক"?"#fee2e2":"#fff",color:t.replyStatus==="অসন্তোষজনক"?"#b91c1c":"#64748b"},children:"✕ অসন্তোষজনক"})]}),i&&e.jsx("div",{style:{marginTop:14,padding:"12px 16px",background:"#f0fdf4",border:"1px solid #86efac",borderRadius:8,fontSize:13,fontFamily:X,color:"#15803d",fontWeight:600},children:"✓ জবাব সন্তোষজনক — কেস এখানেই সমাপ্ত। পরের ধাপগুলো প্রযোজ্য নয়।"})]})}const Q="'Noto Sans Bengali', Arial, sans-serif",ge={fontSize:13,fontWeight:600,fontFamily:Q,color:"#1e293b",display:"block",marginBottom:6},xe={width:"100%",padding:"9px 12px",border:"1px solid #cbd5e1",borderRadius:8,fontSize:13,fontFamily:Q,background:"#fff",color:"#1e293b",outline:"none",boxSizing:"border-box"},be={marginBottom:16},rt={padding:"9px 16px",background:"#1e3a5f",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:Q};function at({data:t,setData:n,onGenerateNotice:s}){const i=(l,f)=>n({...t,[l]:f}),r=Number(t.numberOfCommitteeMembers)||0,a=Te(r),c=r>0&&!!t.notice2Date,h=l=>{const f=Number(l)||0;n({...t,numberOfCommitteeMembers:l,committeeMembers:Ke(t.committeeMembers,f)})};return e.jsxs("div",{style:{background:"#fff",borderRadius:10,border:"1px solid #e2e8f0",padding:20},children:[e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(2, 1fr)",gap:16},children:[e.jsxs("div",{style:be,children:[e.jsx("label",{style:ge,children:"কমিটি সদস্য সংখ্যা *"}),e.jsx("input",{type:"number",min:1,value:t.numberOfCommitteeMembers,onChange:l=>h(l.target.value),style:xe})]}),e.jsxs("div",{style:be,children:[e.jsx("label",{style:ge,children:"নোটিশ ইস্যু তারিখ *"}),e.jsx("input",{type:"date",value:t.notice2Date,onChange:l=>i("notice2Date",l.target.value),style:xe}),t.notice2Date&&e.jsxs("div",{style:{fontSize:11,color:"#64748b",marginTop:3},children:[S(t.notice2Date)," ইং"]})]})]}),r>0&&e.jsxs("div",{style:{padding:"10px 14px",background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:8,fontSize:12.5,fontFamily:Q,color:"#1e40af"},children:["মোট ",r," জন সদস্যের মধ্যে ",e.jsxs("b",{children:[a," জন"]})," শ্রমিক প্রতিনিধি হতে হবে (৫০%, ঊর্ধ্বে রাউন্ড করা)"]}),e.jsx("div",{style:{marginTop:14},children:e.jsx("button",{onClick:s,disabled:!c,style:{...rt,opacity:c?1:.5,cursor:c?"pointer":"not-allowed"},children:"🖨 নোটিশ ২ তৈরি করুন — প্রতিনিধি মনোনয়ন"})})]})}const P="'Noto Sans Bengali', Arial, sans-serif",lt={fontSize:13,fontWeight:600,fontFamily:P,color:"#1e293b",display:"block",marginBottom:6},ct={width:"100%",padding:"9px 12px",border:"1px solid #cbd5e1",borderRadius:8,fontSize:13,fontFamily:P,background:"#fff",color:"#1e293b",outline:"none",boxSizing:"border-box"},J={width:"100%",padding:"6px 8px",border:"1px solid #cbd5e1",borderRadius:6,fontSize:12.5,fontFamily:P,background:"#fff",color:"#1e293b",outline:"none",boxSizing:"border-box"},q={padding:"8px 10px",fontSize:11,fontWeight:700,fontFamily:P,color:"#374151",background:"#f8fafc",textTransform:"uppercase",borderBottom:"1px solid #e2e8f0",borderRight:"1px solid #f1f5f9"},K={padding:"6px 8px",borderBottom:"1px solid #e2e8f0",borderRight:"1px solid #f1f5f9"},dt={padding:"9px 16px",background:"#1e3a5f",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:P};function pt({data:t,setData:n,festivalHolidays:s,onGenerateNotice:i}){const r=Number(t.numberOfCommitteeMembers)||0,a=le(t.showCauseDate,50,s),c=(l,f,o)=>{const g=[...t.committeeMembers];g[l]={...g[l],[f]:o},n({...t,committeeMembers:g})},h=t.committeeMembers.length===r&&r>0&&t.committeeMembers.every(l=>l.name.trim()!=="")&&!!t.notice3Date;return e.jsxs("div",{style:{background:"#fff",borderRadius:10,border:"1px solid #e2e8f0",padding:20},children:[e.jsxs("div",{style:{marginBottom:16,maxWidth:280},children:[e.jsx("label",{style:lt,children:"নোটিশ ইস্যু তারিখ *"}),e.jsx("input",{type:"date",value:t.notice3Date,onChange:l=>n({...t,notice3Date:l.target.value}),style:ct}),t.notice3Date&&e.jsxs("div",{style:{fontSize:11,color:"#64748b",marginTop:3},children:[S(t.notice3Date)," ইং"]})]}),r===0&&e.jsx("div",{style:{padding:16,textAlign:"center",color:"#94a3b8",fontFamily:P,fontSize:13},children:'প্রথমে "প্রতিনিধি মনোনয়ন" ধাপে সদস্য সংখ্যা দিন — টেবিল স্বয়ংক্রিয়ভাবে তৈরি হবে'}),r>0&&e.jsx("div",{style:{overflowX:"auto"},children:e.jsxs("table",{style:{width:"100%",borderCollapse:"collapse",minWidth:700},children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{style:{...q,width:36},children:"SL"}),e.jsx("th",{style:q,children:"কর্মীর নাম"}),e.jsx("th",{style:{...q,width:120},children:"কার্ড নং"}),e.jsx("th",{style:{...q,width:150},children:"পদবী"}),e.jsx("th",{style:{...q,width:150,borderRight:"none"},children:"সেকশন"})]})}),e.jsx("tbody",{children:t.committeeMembers.map((l,f)=>e.jsxs("tr",{children:[e.jsx("td",{style:{...K,textAlign:"center",fontWeight:600},children:L(l.slNo)}),e.jsx("td",{style:K,children:e.jsx("input",{value:l.name,onChange:o=>c(f,"name",o.target.value),style:J})}),e.jsx("td",{style:K,children:e.jsx("input",{value:l.cardNo,onChange:o=>c(f,"cardNo",o.target.value),style:J})}),e.jsx("td",{style:K,children:e.jsx("input",{value:l.designation,onChange:o=>c(f,"designation",o.target.value),style:J})}),e.jsx("td",{style:{...K,borderRight:"none"},children:e.jsx("input",{value:l.section,onChange:o=>c(f,"section",o.target.value),style:J})})]},f))})]})}),a&&e.jsxs("div",{style:{marginTop:14,padding:"10px 14px",background:"#fef3c7",border:"1px solid #fde68a",borderRadius:8,fontSize:12.5,fontFamily:P,color:"#92400e"},children:["তদন্ত সময়সীমা: কারণ দর্শানোর তারিখ (",S(t.showCauseDate),") + ৫০ দিন, শুক্রবার ও ছুটির দিন বাদে = ",e.jsx("b",{children:S(a)})]}),e.jsxs("div",{style:{marginTop:14},children:[e.jsx("button",{onClick:i,disabled:!h,style:{...dt,opacity:h?1:.5,cursor:h?"pointer":"not-allowed"},children:"🖨 নোটিশ ৩ তৈরি করুন — কমিটি মনোনয়ন ও তদন্ত সময়সীমা"}),!h&&r>0&&e.jsx("div",{style:{marginTop:6,fontSize:11.5,color:"#94a3b8",fontFamily:P},children:"সব কমিটি সদস্যের নাম ও নোটিশ ইস্যু তারিখ পূরণ করুন প্রথমে"})]})]})}const pe="'Noto Sans Bengali', Arial, sans-serif",te={fontSize:13,fontWeight:600,fontFamily:pe,color:"#1e293b",display:"block",marginBottom:6},mt={width:"100%",padding:"9px 12px",border:"1px solid #cbd5e1",borderRadius:8,fontSize:13,fontFamily:pe,background:"#fff",color:"#1e293b",outline:"none",boxSizing:"border-box"},ne={marginBottom:16},ht={padding:"9px 16px",background:"#1e3a5f",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:pe};function ft({data:t,setData:n,onGenerateOutput:s}){const i=(a,c)=>n({...t,[a]:c}),r=!!(t.investigationReportSummary&&t.recommendation&&t.evaluationDate);return e.jsxs("div",{style:{background:"#fff",borderRadius:10,border:"1px solid #e2e8f0",padding:20},children:[e.jsxs("div",{style:{...ne,maxWidth:280},children:[e.jsx("label",{style:te,children:"তারিখ *"}),e.jsx("input",{type:"date",value:t.evaluationDate,onChange:a=>i("evaluationDate",a.target.value),style:mt}),t.evaluationDate&&e.jsxs("div",{style:{fontSize:11,color:"#64748b",marginTop:3},children:[S(t.evaluationDate)," ইং"]})]}),e.jsxs("div",{style:{...ne,paddingBottom:16,borderBottom:"1px solid #e2e8f0"},children:[e.jsx("label",{style:te,children:"সারাংশ (বিস্তারিত প্রতিবেদন): *"}),e.jsx(V,{value:t.investigationReportSummary,onChange:a=>i("investigationReportSummary",a),rows:5,placeholder:"গত ২ জুলাই ২০২৬ইং তারিখ ... তদন্ত কমিটির পর্যালোচনার ভিত্তিতে ..."})]}),e.jsxs("div",{style:ne,children:[e.jsx("label",{style:te,children:"সুপারিশ: *"}),e.jsx(V,{value:t.recommendation,onChange:a=>i("recommendation",a),rows:4,placeholder:"তদন্ত কমিটির সুপারিশ লিখুন..."})]}),e.jsx("button",{onClick:s,disabled:!r,style:{...ht,opacity:r?1:.5,cursor:r?"pointer":"not-allowed"},children:"🖨 প্রতিবেদন ও সুপারিশ তৈরি করুন"})]})}const U="'Noto Sans Bengali', Arial, sans-serif",ye={fontSize:13,fontWeight:600,fontFamily:U,color:"#1e293b",display:"block",marginBottom:6},ut={width:"100%",padding:"9px 12px",border:"1px solid #cbd5e1",borderRadius:8,fontSize:13,fontFamily:U,background:"#fff",color:"#1e293b",outline:"none",boxSizing:"border-box"},je={marginBottom:16},gt={padding:"9px 16px",background:"#1e3a5f",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:U};function xt({data:t,setData:n,festivalHolidays:s,onGenerateNotice4:i}){const r=(h,l)=>n({...t,[h]:l}),a=ce(t.evaluationDate,s),c=!!(t.finalDecision&&t.evaluationDate&&t.punishmentType);return e.jsxs("div",{style:{background:"#fff",borderRadius:10,border:"1px solid #e2e8f0",padding:20},children:[!t.evaluationDate&&e.jsx("div",{style:{marginBottom:16,padding:"10px 14px",background:"#fef3c7",border:"1px solid #fde68a",borderRadius:8,fontSize:12.5,fontFamily:U,color:"#92400e"},children:'প্রথমে "মূল্যায়ন" ধাপে তারিখ ও প্রতিবেদন পূরণ করুন — নোটিশ ৪-এর তারিখ সেই তারিখ থেকে স্বয়ংক্রিয়ভাবে গণনা হবে।'}),e.jsxs("div",{style:je,children:[e.jsx("label",{style:ye,children:"চূড়ান্ত সিদ্ধান্ত: *"}),e.jsx(V,{value:t.finalDecision,onChange:h=>r("finalDecision",h),rows:5,placeholder:"কর্তৃপক্ষের চূড়ান্ত সিদ্ধান্ত লিখুন..."})]}),e.jsxs("div",{style:je,children:[e.jsx("label",{style:ye,children:"শাস্তি/দণ্ড: *"}),e.jsxs("select",{style:ut,value:t.punishmentType||"",onChange:h=>r("punishmentType",h.target.value),children:[e.jsx("option",{value:"",children:"-- শাস্তি নির্বাচন করুন --"}),e.jsx("option",{value:"বরখাস্ত",children:"বরখাস্ত"}),e.jsx("option",{value:"বরখাস্ত [ধারা ২৩-এর ৪(খ/ছ)]",children:"বরখাস্ত [ধারা ২৩-এর ৪(খ/ছ)]"}),e.jsx("option",{value:"অপসারণ",children:"অপসারণ"}),e.jsx("option",{value:"নিচের পদে, গ্রেডে বা বেতন স্কেলে অনধিক এক বৎসর পর্যন্ত আনয়ন",children:"নিচের পদে, গ্রেডে বা বেতন স্কেলে অনধিক এক বৎসর পর্যন্ত আনয়ন"}),e.jsx("option",{value:"অনধিক এক বৎসরের জন্য পদোন্নতি বন্ধ",children:"অনধিক এক বৎসরের জন্য পদোন্নতি বন্ধ"}),e.jsx("option",{value:"অনধিক এক বৎসরের জন্য মজুরী বৃদ্ধি বন্ধ",children:"অনধিক এক বৎসরের জন্য মজুরী বৃদ্ধি বন্ধ"}),e.jsx("option",{value:"জরিমানা",children:"জরিমানা"}),e.jsx("option",{value:"অনধিক সাত দিন পর্যন্ত বিনা মজুরীতে বা বিনা খোরাকীতে সাময়িক বরখাস্ত",children:"অনধিক সাত দিন পর্যন্ত বিনা মজুরীতে বা বিনা খোরাকীতে সাময়িক বরখাস্ত"}),e.jsx("option",{value:"ভর্ৎসনা ও সতর্কীকরণ",children:"ভর্ৎসনা ও সতর্কীকরণ"})]})]}),e.jsxs("div",{style:{marginBottom:20,fontSize:12.5,fontFamily:U,color:"#64748b"},children:["নোটিশ ৪ ইস্যু তারিখ (স্বয়ংক্রিয় — মূল্যায়নের তারিখের পরবর্তী কর্মদিবস):"," ",e.jsx("strong",{style:{color:"#1e293b"},children:a?`${S(a)} ইং`:"—"})]}),e.jsx("button",{onClick:i,disabled:!c,style:{...gt,opacity:c?1:.5,cursor:c?"pointer":"not-allowed"},children:"🖨 নোটিশ ৪ তৈরি করুন — চূড়ান্ত সিদ্ধান্ত অবহিতকরণ"}),!c&&e.jsx("div",{style:{marginTop:6,fontSize:11.5,color:"#94a3b8",fontFamily:U},children:'"শাস্তি/দণ্ড", "চূড়ান্ত সিদ্ধান্ত" ও "মূল্যায়ন" ধাপের তারিখ পূরণ করুন প্রথমে'})]})}function ie(t,n){const s=[],i=/\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*/g;let r=0,a,c=0;for(;(a=i.exec(t))!==null;)a.index>r&&s.push(t.slice(r,a.index)),a[1]!==void 0?s.push(e.jsx("strong",{children:e.jsx("em",{children:a[1]})},`${n}-bi${c}`)):a[2]!==void 0?s.push(e.jsx("strong",{children:a[2]},`${n}-b${c}`)):a[3]!==void 0&&s.push(e.jsx("em",{children:a[3]},`${n}-i${c}`)),r=i.lastIndex,c++;return r<t.length&&s.push(t.slice(r)),s}function bt(t,n){const s=t.split(`
`),i=[];let r=0,a=0;for(;r<s.length;){const c=s[r],h=c.match(/^\s*•\s+(.*)$/),l=c.match(/^\s*\d+\.\s+(.*)$/);if(h){const f=[];for(;r<s.length&&s[r].match(/^\s*•\s+(.*)$/);)f.push(s[r].match(/^\s*•\s+(.*)$/)[1]),r++;i.push(e.jsx("ul",{className:"nl-rt-list",children:f.map((o,g)=>e.jsx("li",{children:ie(o,`${n}-ul-${a}-${g}`)},g))},`${n}-ul-${a++}`));continue}if(l){const f=[];for(;r<s.length&&s[r].match(/^\s*\d+\.\s+(.*)$/);)f.push(s[r].match(/^\s*\d+\.\s+(.*)$/)[1]),r++;i.push(e.jsx("ol",{className:"nl-rt-list",children:f.map((o,g)=>e.jsx("li",{children:ie(o,`${n}-ol-${a}-${g}`)},g))},`${n}-ol-${a++}`));continue}c.trim()===""?i.push(e.jsx("div",{className:"nl-rt-spacer"},`${n}-sp-${a++}`)):i.push(e.jsx("p",{className:"nl-rt-p",children:ie(c,`${n}-p-${a}`)},`${n}-p-${a++}`)),r++}return e.jsx(e.Fragment,{children:i})}function oe(t,n="rt"){if(!t)return null;if(Ee(t)){const s=re(t);return e.jsx("div",{className:"nl-rt-html",dangerouslySetInnerHTML:{__html:s}})}return bt(t,n)}const yt=["০","১","২","৩","৪","৫","৬","৭","৮","৯"],ve=t=>t.replace(/[0-9]/g,n=>yt[Number(n)]),jt=t=>!t||!t.trim()?"___":t.trim().split(/\s+/).map(s=>s[0]).join(" ").toUpperCase()||"___",vt={1:"SC",2:"IN",3:"IC",4:"FD",evaluation:"EV"},we=(t,n,s)=>{const i=jt(t.factoryName),r=vt[String(n)],a=t.cardNo?ve(String(t.cardNo)):"___";let c="__-__-____";if(s){const h=new Date(s);if(!isNaN(h.getTime())){const l=String(h.getDate()).padStart(2,"0"),f=String(h.getMonth()+1).padStart(2,"0"),o=String(h.getFullYear());c=ve(`${l}-${f}-${o}`)}}return`${i}/${r}-${a}/${c}`},wt=t=>new DOMParser().parseFromString(t,"text/html").body.textContent?.trim()||"",Nt=({data:t,notice:n,authorization:s,festivalHolidays:i})=>{const r=Number(t.numberOfCommitteeMembers)||0,a=Te(r),c=le(t.showCauseDate,50,i),h=t.subject==="অস্থায়ী স্থগিতাদেশ সহ কারণ দর্শানোর নোটিশ।",l=ce(t.evaluationDate,i),f=["শ্রমিকের ব্যক্তিগত নথি।","সংশ্লিষ্ট ব্যক্তি।"],o=n===1?t.showCauseDate:n===2?t.notice2Date:n===3?t.notice3Date:n===4?l:t.evaluationDate,g=t.referenceNo||we(t,n,o),A=n==="evaluation"?"flow":"single";return w.useEffect(()=>{if(n!=="evaluation")return;const y=document.querySelectorAll(".nl-eval-text");if(!y.length)return;const j="0.45em",C="0.55em",$="1.5em",m="0.2em",u=d=>{d.style.setProperty("font-size","1em","important"),d.style.setProperty("line-height","inherit","important"),d.style.setProperty("font-family","inherit","important"),d.style.setProperty("width","auto","important"),d.style.setProperty("max-width","none","important");const x=d.tagName;x==="P"||x==="DIV"?(d.style.setProperty("margin",`0 0 ${j}`,"important"),d.style.setProperty("padding","0","important")):x==="UL"||x==="OL"?(d.style.setProperty("margin",`0 0 ${C}`,"important"),d.style.setProperty("padding",`0 0 0 ${$}`,"important")):x==="LI"?(d.style.setProperty("margin",`0 0 ${m}`,"important"),d.style.setProperty("padding","0","important")):["STRONG","B","EM","I","U"].includes(x)||(d.style.setProperty("margin","0","important"),d.style.setProperty("padding","0","important"))};y.forEach(d=>{u(d),d.querySelectorAll("*").forEach(u);const x=Array.from(d.children),b=x[x.length-1];b&&b.style.setProperty("margin-bottom","0","important")})},[n,t.investigationReportSummary,t.recommendation]),e.jsxs("div",{className:"nl-page",children:[e.jsxs("div",{className:`nl-wrap ${A==="flow"?"nl-wrap--flow":"nl-wrap--single"}`,"data-wrap-mode":A,children:[e.jsxs("div",{className:"nl-header",children:[t.factoryName&&e.jsx("h1",{className:"nl-co-name",children:t.factoryName}),t.factoryAddress&&e.jsx("p",{className:"nl-co-addr",children:t.factoryAddress})]}),e.jsxs("div",{className:"nl-title-bar",children:[e.jsxs("h2",{className:"nl-title",children:["সূত্রঃ ",g]}),e.jsx("div",{className:"nl-meta",children:e.jsxs("span",{className:"nl-meta-date",children:["তারিখ : ",e.jsxs("strong",{children:[S(o)," ইং"]})]})})]}),(n===1||n===2||n===4)&&e.jsx("div",{className:"nl-emp-box",children:e.jsx("div",{className:"nl-emp-col",children:e.jsx("table",{className:"nl-emp-tbl",children:e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:"নাম"}),e.jsx("td",{children:t.employeeName||"—"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"পদবী"}),e.jsx("td",{children:t.designation||"—"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"কার্ড নং"}),e.jsx("td",{children:t.cardNo||"—"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"সেকশন"}),e.jsx("td",{children:t.section||"—"})]})]})})})}),n===3&&e.jsxs("div",{className:"nl-salute",style:{fontWeight:400},children:[e.jsx("p",{style:{margin:0},children:"প্রতি,"}),e.jsx("p",{style:{margin:0},children:"তদন্ত কমিটির সদস্যবৃন্দ।"})]}),n==="evaluation"&&e.jsxs("div",{className:"nl-salute",style:{fontWeight:400},children:[e.jsx("p",{style:{margin:0},children:"প্রতি,"}),e.jsx("p",{style:{margin:0},children:"ব্যবস্থাপনা কর্তৃপক্ষ।"})]}),e.jsxs("p",{className:"nl-subject",children:["বিষয়ঃ ",n===1&&e.jsx("u",{children:e.jsx("strong",{children:t.subject})}),n===2&&e.jsx("u",{children:e.jsx("strong",{children:"নিরপেক্ষ তদন্ত কমিটি গঠন এবং প্রতিনিধি মনোনয়ন প্রসঙ্গে।"})}),n===3&&e.jsx("u",{children:e.jsx("strong",{children:"তদন্ত কমিটিতে সদস্য মনোনীতকরণ ও নিরপেক্ষ তদন্ত পরিচালনার আদেশ।"})}),n===4&&e.jsx("u",{children:e.jsx("strong",{children:"শৃঙ্খলামূলক ব্যবস্থা গ্রহণ সংক্রান্ত চূড়ান্ত সিদ্ধান্ত অবহিতকরণ।"})}),n==="evaluation"&&e.jsxs("u",{children:["অভিযোগের ",e.jsxs("u",{style:{whiteSpace:"nowrap"},children:["(সূত্র:",we(t,1,t.showCauseDate),")"]})," ",e.jsx("strong",{children:"নিরপেক্ষ তদন্ত প্রতিবেদন দাখিল প্রসঙ্গে।"})]})]}),e.jsx("p",{className:"nl-salute",style:{fontWeight:400},children:"জনাব/জনাবা,"}),e.jsx("div",{className:"nl-gap"}),e.jsxs("div",{className:"nl-body",children:[n===1&&e.jsxs(e.Fragment,{children:[e.jsxs("p",{className:"nl-para",children:["আপনার বিরুদ্ধে অভিযোগ এই যে,"," ",t.complaint?wt(t.complaint):"_____"]}),e.jsx("div",{className:"nl-gap"}),e.jsx("p",{className:"nl-para",children:"আপনার এহেন কর্মকাণ্ড প্রতিষ্ঠানের শৃঙ্খলা ও নীতিমালার সম্পূর্ণ পরিপন্থী এবং বাংলাদেশ শ্রম আইন, ২০০৬ অনুযায়ী গুরুতর অসদাচরণের শামিল।"}),e.jsxs("p",{className:"nl-para",children:["অতএব, আনীত অভিযোগের প্রেক্ষিতে আপনাকে আত্মপক্ষ সমর্থনের সুযোগ প্রদান করা হলো। কেন আপনার বিরুদ্ধে উপযুক্ত আইনানুগ ও শৃঙ্খলামূলক ব্যবস্থা গ্রহণ করা হবে না, তার লিখিত জবাব আগামী ",e.jsx("strong",{children:"০৭ (সাত) কর্মদিবসের"})," মধ্যে নিম্নস্বাক্ষরকারীর নিকট দাখিল করার জন্য নির্দেশ প্রদান করা হলো।"]}),e.jsx("div",{className:"nl-gap"}),e.jsx("p",{className:"nl-para",children:"নির্ধারিত সময়ের মধ্যে সন্তোষজনক লিখিত জবাব দাখিল করতে ব্যর্থ হলে ধরে নেওয়া হবে যে আপনার স্বপক্ষে কোনো যুক্তি বা ব্যাখ্যা নেই। সেক্ষেত্রে কর্তৃপক্ষ আপনার বিরুদ্ধে একতরফা ও আইনানুগ সিদ্ধান্ত গ্রহণ করবে।"}),h&&e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"nl-gap"}),e.jsx("p",{className:"nl-para nl-suspension",children:"উল্লেখ্য যে, এ বিষয়ে পরবর্তী সিদ্ধান্ত না দেওয়া পর্যন্ত আপনাকে কাজ থেকে সাময়িকভাবে বরখাস্ত রাখা হলো।"})]})]}),n===2&&e.jsxs(e.Fragment,{children:[e.jsxs("p",{className:"nl-para",children:["আপনার অবগতির জন্য জানানো যাচ্ছে যে, গত ",e.jsx("strong",{children:S(t.showCauseDate)})," ইং তারিখে আপনার বিরুদ্ধে আনীত অভিযোগের প্রেক্ষিতে প্রদানকৃত"," ",e.jsx("strong",{children:S(t.replyDate)})," ইং তারিখের লিখিত ব্যাখ্যাটি ব্যবস্থাপনা কর্তৃপক্ষের নিকট সন্তোষজনক বিবেচিত হয়নি।"]}),e.jsx("p",{className:"nl-para",children:"ফলশ্রুতিতে, আনীত অভিযোগের সঠিক ও নিরপেক্ষ তদন্ত পরিচালনার স্বার্থে একটি তদন্ত কমিটি গঠনের সিদ্ধান্ত গ্রহণ করা হয়েছে।"}),e.jsxs("p",{className:"nl-para",children:["উক্ত তদন্ত কার্যক্রমে আপনার পক্ষ সমর্থনের জন্য আপনার সমপদস্থ বা উর্ধ্বতন পর্যায়ের ",e.jsx("strong",{children:L(a)})," জন প্রতিনিধির নাম ও পরিচয়, অত্র নোটিশ প্রাপ্তির ৪ (চার) দিনের মধ্যে নিম্নস্বাক্ষরকারী কর্তৃপক্ষের নিকট লিখিতভাবে জমা দেওয়ার জন্য নির্দেশ প্রদান করা হলো।"]}),e.jsx("p",{className:"nl-para",children:"উল্লেখ্য যে নির্ধারিত সময়ের মধ্যে প্রতিনিধি মনোনয়নে ব্যর্থ হলে, বিষয়টি তদন্তে আপনার অনিচ্ছা হিসেবে গণ্য হবে এবং আইনানুগভাবে তদন্ত কার্যক্রমটি একতরফাভাবে সম্পন্ন করা হবে।"})]}),n===3&&e.jsxs(e.Fragment,{children:[e.jsxs("p",{className:"nl-para",children:["আপনাদের অবগতির জন্য জানানো যাচ্ছে যে, গত ",e.jsx("strong",{children:S(t.showCauseDate)})," ইং তারিখে জনাব/জনাবা ",e.jsx("strong",{children:t.employeeName||"—"})," (কার্ড নং: ",t.cardNo||"—",", ",t.designation||"—",","," ",t.section||"—",")-এর বিরুদ্ধে আনীত অভিযোগের নিরপেক্ষ তদন্ত পরিচালনার লক্ষ্যে আপনাদের উক্ত তদন্ত কমিটিতে সদস্য হিসেবে মনোনীত করা হলো।"]}),e.jsxs("p",{className:"nl-para",children:["এমতাবস্থায়, আগামী ",e.jsx("strong",{children:S(c)})," ইং তারিখের মধ্যে কোনো প্রকার স্বার্থের দ্বন্দ্ব (Conflict of Interest) ব্যতীত, সম্পূর্ণ নিরপেক্ষতা ও পেশাদারিত্বের সাথে উক্ত তদন্ত কার্যক্রমটি সম্পন্ন করে একটি সুনির্দিষ্ট তদন্ত প্রতিবেদন কর্তৃপক্ষের নিকট দাখিল করার জন্য নির্দেশ প্রদান করা হলো।"]}),e.jsx("p",{className:"nl-para",style:{fontWeight:700,textDecoration:"underline",marginTop:14},children:"কমিটির তালিকাঃ"}),e.jsxs("table",{className:"nl-committee-tbl",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{style:{width:"15%"},children:"ক্রমিক"}),e.jsx("th",{style:{width:"25%"},children:"নাম"}),e.jsx("th",{style:{width:"20%"},children:"কার্ড নং"}),e.jsx("th",{style:{width:"20%"},children:"পদবী"}),e.jsx("th",{style:{width:"20%"},children:"সেকশন"})]})}),e.jsx("tbody",{children:t.committeeMembers.map((y,j)=>e.jsxs("tr",{children:[e.jsx("td",{style:{textAlign:"center"},children:L(y.slNo)}),e.jsx("td",{children:y.name||"—"}),e.jsx("td",{style:{textAlign:"center"},children:y.cardNo||"—"}),e.jsx("td",{children:y.designation||"—"}),e.jsx("td",{children:y.section||"—"})]},j))})]})]}),n===4&&e.jsxs(e.Fragment,{children:[e.jsx("p",{className:"nl-para",children:"আপনাকে জানানো যাচ্ছে যে, আপনার বিরুদ্ধে উত্থাপিত অভিযোগের প্রেক্ষিতে গঠিত তদন্ত কমিটি নিরপেক্ষ ও বিস্তারিত তদন্ত সম্পন্ন করেছে।"}),e.jsxs("p",{className:"nl-para",children:["উক্ত তদন্ত কার্যক্রমের বিবরণী ও ফলাফল নিম্নরূপ:",e.jsx("div",{className:"nl-para",children:t.finalDecision?oe(t.finalDecision,"fd4"):"_____"})]}),e.jsx("p",{className:"nl-para",children:"উপরে উল্লেখিত তদন্ত কমিটির দাখিলকৃত রিপোর্ট, প্রমাণাদি এবং সার্বিক পর্যালোচনা করে ব্যবস্থাপনা কর্তৃপক্ষ নিশ্চিত হয়েছে যে, আনীত অভিযোগসমূহ শতভাগ সত্য এবং প্রমাণিত। আপনার এহেন আচরণ প্রতিষ্ঠানের নিয়মনীতি ও কর্মক্ষেত্রের শৃঙ্খলাবিধির মারাত্মক লঙ্ঘন।"}),e.jsxs("p",{className:"nl-para",children:["অতএব, তদন্ত কমিটির সুপারিশ ও অপরাধের গুরুত্ব বিবেচনা করে ব্যবস্থাপনা কর্তৃপক্ষ আপনাকে চাকরি থেকে ",e.jsxs("strong",{children:['"',t.punishmentType||"_____",'"']})," ","করার চূড়ান্ত সিদ্ধান্ত গ্রহণ করেছে।"]}),e.jsx("p",{className:"nl-para",children:"উক্ত সিদ্ধান্ত অত্র পত্র প্রাপ্তির তারিখ থেকে কার্যকর হবে। আপনার হিসাব সংক্রান্ত চূড়ান্ত পাওনাদী নিষ্পত্তির জন্য নিয়ম অনুযায়ী আগামী ১৫ দিনের মধ্যে মানবসম্পদ ও হিসাব বিভাগের সাথে যোগাযোগ করার জন্য নির্দেশ প্রদান করা হলো।"})]}),n==="evaluation"&&e.jsxs(e.Fragment,{children:[e.jsxs("p",{className:"nl-para",children:["গত ",S(t.notice3Date)," ইং তারিখে জারিকৃত নোটিশের আলোকে আমরা নিম্নস্বাক্ষরকারীগণ অভিযুক্ত ",t.designation," ",e.jsxs("strong",{children:[t.employeeName,"-",t.cardNo]})," এর বিরুদ্ধে আনীত অভিযোগের নিরপেক্ষ তদন্তের জন্য কমিটি সদস্য হিসেবে দায়িত্ব প্রাপ্ত হই। দায়িত্ব গ্রহণের পর কালক্ষেপণ না করে তদন্ত কমিটি ঘটনার সার্বিক সত্যতা উদঘাটনে প্রাপ্ত লিখিত ও মৌখিক সাক্ষ্য, সিস্টেম ভিত্তিক তথ্য সংগ্রহ এবং সংশ্লিষ্ট অন্যান্য আলামত সূক্ষ্মভাবে পর্যবেক্ষণ করে আজ ",S(t.evaluationDate)," ইং তারিখে তদন্ত কার্যক্রম সম্পন্ন করেছে।",e.jsx("br",{}),e.jsx("br",{}),e.jsx("strong",{children:"নিচে তদন্তের বিস্তারিত বিবরণ ও সিদ্ধান্ত উপস্থাপন করা হলো:"})]}),e.jsxs("div",{className:"nl-eval-section",children:[e.jsx("p",{className:"nl-eval-label",children:e.jsx("strong",{children:e.jsx("u",{children:"তদন্তে প্রাপ্ত জবানবন্দি ও সাক্ষ্য-প্রমাণ:"})})}),e.jsx("div",{className:"nl-eval-text",children:t.investigationReportSummary?oe(t.investigationReportSummary,"sum"):"—"}),e.jsx("hr",{className:"nl-eval-divider"})]}),e.jsxs("div",{className:"nl-eval-section",children:[e.jsx("p",{className:"nl-eval-label",children:e.jsx("strong",{children:e.jsx("u",{children:"মতামত ও সুপারিশ:"})})}),e.jsx("div",{className:"nl-eval-text",children:t.recommendation?oe(t.recommendation,"rec"):"—"}),e.jsx("hr",{className:"nl-eval-divider"})]})]})]}),(n===1||n===2||n===4)&&e.jsxs("div",{className:"nl-copy",children:[e.jsx("p",{children:e.jsx("strong",{children:e.jsx("u",{children:"অনুলিপি :"})})}),e.jsx("ol",{children:f.map((y,j)=>e.jsxs("li",{children:[e.jsxs("span",{children:[L(j+1),"."]}),y]},j))})]}),e.jsx("div",{className:"nl-footer",children:n==="evaluation"?e.jsx(e.Fragment,{children:t.committeeMembers.length>0&&e.jsx("div",{className:"nl-committee-sig-row",children:t.committeeMembers.map((y,j)=>e.jsxs("div",{className:"nl-committee-sig-col",children:[e.jsx("div",{className:"nl-committee-sig-name",children:y.name||"—"}),e.jsxs("div",{className:"nl-committee-sig-desig",children:[y.designation||"—",y.section?` (${y.section})`:""]})]},j))})}):e.jsxs(e.Fragment,{children:[e.jsx("p",{className:"nl-authority",children:"নির্দেশক্রমে,"}),e.jsx("div",{className:"nl-auth-sig-wrap",children:e.jsx(Be,{value:s,lang:"bn",hidePrepared:!0,hideTopBorder:!0})})]})})]}),e.jsx("style",{children:`
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

        /* Standard/equal-length top signature line when the authority
           block renders 2+ signers side by side (PrintSignatureRow,
           defined in ../../common/AuthorizationBlock — not part of this
           file). This forces every direct signer column inside that
           block onto an equal-width flex track, so the border-top
           "signature line" above each name is the same length for every
           signer regardless of how long any individual name/designation
           text is (matches reference layout, Image 2). If
           AuthorizationBlock renders its own internal flex/grid with a
           different structure than a flat row of equal-width children,
           this override may need to target its actual class names
           instead — share AuthorizationBlock.tsx for a precise fix. */
        .nl-auth-sig-wrap { width: 100%; }
        .nl-auth-sig-wrap > * { display: flex !important; width: 100% !important; }
        .nl-auth-sig-wrap > * > * { flex: 1 1 0 !important; min-width: 0 !important; text-align: center !important; }

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
        .nl-para { font-size: 13.5px; line-height: 1.85; text-align: justify; margin: 0; padding: 0 0 12px; }
        /* Dedicated spacer element (not a <p>, no shared class with
           .nl-para) inserted BETWEEN paragraphs as a bulletproof gap —
           immune to any margin/padding reset rule that might target
           p tags or .nl-para specifically inside .nl-body (e.g. from
           the imported BASE_PRINT_CSS). */
        .nl-gap { display: block; width: 100%; height: 10px; }

        /* Evaluation output (প্রতিবেদন ও সুপারিশ) — label + rich-text
           content (renderRichText()'s actual <p>/<ul>/<ol> output), each
           section closed off with a dashed divider. The base rules here
           are a fallback; the normalize useEffect above forces real
           inline !important values on the actual rendered elements,
           since inline !important from renderRichText()'s own output
           can otherwise outrank these stylesheet rules in the cloned
           print DOM. */
        .nl-eval-section { margin-bottom: 10px; }
        .nl-eval-label { font-size: 13.5px; font-weight: 400; margin: 0 0 4px; color: #111827; }
        .nl-eval-text { font-size: 13.5px; line-height: 1.85; text-align: justify; margin: 0 0 8px; }
        .nl-eval-text p, .nl-eval-text div { margin: 0 0 6px; }
        .nl-eval-text ul, .nl-eval-text ol { margin: 0 0 8px; padding-left: 22px; }
        .nl-eval-text li { margin-bottom: 3px; }
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

        ${ae}

        @media print {
          /* Uniform 15mm margin on all four sides (was 14mm top/bottom,
             15mm left/right — asymmetric). */
          @page { size: A4 portrait; margin: 15mm; }
          body * { visibility: hidden !important; }
          .nl-page, .nl-page * { visibility: visible !important; }
          .nl-page {
            position: absolute !important; inset: 0 !important; width: 100% !important;
            min-height: unset !important; padding: 0 !important; margin: 0 !important;
            box-shadow: none !important; border-radius: 0 !important; background: white !important;
          }

          /* .nl-wrap--flow (EVALUATION ONLY): min-height ONLY — no fixed
             height, no page-break-inside:avoid. A fixed one-page height
             + avoid-break treated the WHOLE letter as a single
             unbreakable box; content that's genuinely longer than one
             page (the evaluation report) can't honor that, so the
             browser was forced to reserve a big blank gap at the bottom
             of page 1 and push everything else onto a mostly-empty page
             2. min-height alone still guarantees a full-page-tall flex
             column, so .nl-footer's margin-top:auto still pins the
             committee signature block to the bottom of the LAST page —
             while letting genuinely long content grow past one page and
             break at the finer, section-level boundaries set below
             (.nl-para / .nl-eval-section / .nl-eval-label /
             .nl-committee-sig-row) instead of wherever it happens to
             overflow. */
          .nl-wrap--flow { min-height: calc(297mm - 30mm) !important; }

          /* .nl-wrap--single (Notices 1, 2, 3, 4): these are always
             bounded, short-form letters and must render on EXACTLY one
             page — restores the original fixed-height +
             page-break-inside:avoid behaviour so Notice 4's চূড়ান্ত
             সিদ্ধান্ত (and 1–3) never spill onto a second page. */
          .nl-wrap--single {
            height: calc(297mm - 30mm) !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .nl-body { flex: 1 !important; justify-content: flex-start !important; margin-bottom: 10pt !important; }
          .nl-salute { margin: 6pt 0 8pt !important; }
          /* Spacing switched from margin to padding for print — padding
             cannot collapse and is not touched by common print-reset
             rules (e.g. "p { margin: 0 }") that may live in the imported
             BASE_PRINT_CSS. This guarantees visible gaps between every
             .nl-para in the notice body, including right after the
             অভিযোগ/complaint paragraph, matching the reference layout's
             clear paragraph spacing (Image 2). break-inside:avoid keeps
             a single paragraph from splitting mid-sentence across the
             page boundary. */
          .nl-para {
            font-size: 10pt !important; line-height: 1.75 !important; margin: 0 !important; padding: 0 0 10pt !important;
            break-inside: avoid !important; page-break-inside: avoid !important;
          }
          .nl-gap { display: block !important; width: 100% !important; height: 8pt !important; }
          /* break-after:avoid — a section heading is never left as the
             last line on a page with its own content starting fresh on
             the next (the exact orphaning this was written to fix). */
          .nl-eval-label {
            font-size: 10pt !important; margin: 0 0 4pt !important;
            break-after: avoid !important; page-break-after: avoid !important;
          }
          .nl-eval-text { font-size: 10pt !important; line-height: 1.75 !important; margin: 0 0 8pt !important; }
          /* NOT break-inside:avoid here — .nl-eval-section can wrap a
             LARGE block (a heading plus every witness statement in the
             investigation summary). Marking the whole section
             unbreakable meant that once it didn't fit in whatever space
             was left on the current page, the ENTIRE section — heading
             and all six items — had to jump to the next page together,
             leaving roughly half the previous page blank. Break control
             is applied at the individual item/paragraph level instead
             (.nl-eval-text li / .nl-eval-text > p below), so the list
             can break BETWEEN items and fill each page properly, while
             never splitting in the middle of a single item. */
          .nl-eval-section { margin-bottom: 8pt !important; }
          .nl-eval-divider { margin: 0 !important; }
          /* Each witness statement / recommendation paragraph is a small
             atomic unit — safe to keep from splitting mid-item without
             risking a big page-1 gap, unlike the whole section above. */
          .nl-eval-text li, .nl-eval-text > p {
            break-inside: avoid !important; page-break-inside: avoid !important;
          }
          /* Keep the investigation-committee signature block together —
             columns shouldn't split across a page boundary. */
          .nl-committee-sig-row { break-inside: avoid !important; page-break-inside: avoid !important; }
          .nl-committee-sig-name { font-size: 10pt !important; }
          .nl-committee-sig-desig { font-size: 8.5pt !important; }
          .nl-committee-tbl { font-size: 9.5pt !important; }
          .nl-auth-sig-wrap > * { display: flex !important; width: 100% !important; }
          .nl-auth-sig-wrap > * > * { flex: 1 1 0 !important; min-width: 0 !important; text-align: center !important; }
          .nl-committee-tbl thead tr, .nl-committee-tbl th {
            -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
            background: #1e3a5f !important; color: #fff !important;
          }
          .nl-footer { page-break-inside: avoid !important; break-inside: avoid !important; }
        }
      `})]})},St="'Noto Sans Bengali', 'Noto Sans', Arial, sans-serif",Dt={done:"সম্পন্ন",progress:"চলমান",pending:"অসম্পন্ন",na:"প্রযোজ্য নয়"},Ct=14,kt=96/25.4,Ne=(297-Ct*2)*kt,zt=.6,Tt=({data:t,festivalHolidays:n,onPrint:s,onClose:i})=>{const r=ce(t.evaluationDate,n),a=t.replyStatus==="সন্তোষজনক",c=t.replyStatus==="অসন্তোষজনক",h=!!t.replyStatus,l=(()=>{if(!t.showCauseDate||!r)return null;const m=new Date(t.showCauseDate),u=new Date(r);if(isNaN(m.getTime())||isNaN(u.getTime()))return null;const d=Math.round((u.getTime()-m.getTime())/(1e3*60*60*24));return d>=0?d:null})(),f=w.useRef(null),o=w.useRef(null);w.useLayoutEffect(()=>{const m=()=>{const d=f.current,x=o.current;if(!d||!x)return;d.style.setProperty("--pf-print-zoom","1");const b=x.scrollHeight,k=b>Ne?Math.max(Ne/b,zt):1;d.style.setProperty("--pf-print-zoom",k.toFixed(3))};m();const u=typeof document<"u"?document.fonts:void 0;u?.ready&&u.ready.then(m).catch(()=>{})},[t,n]);const g=[{step:1,stage:"ধাপ ১",title:"কারণ দর্শানো",description:"কারণ দর্শানোর নোটিশ জারি করা হয়।",date:t.showCauseDate,output:"নোটিশ ১"},{step:2,stage:"ধাপ ২",title:"জবাব ও অবস্থা",description:"কর্মীর জবাব যাচাই করা হয়।",date:t.replyDate,output:t.replyStatus||"—"}],A=[{step:3,stage:"ধাপ ৩",title:"প্রতিনিধি মনোনয়ন",description:"কমিটি সদস্য সংখ্যা ও শ্রমিক প্রতিনিধি মনোনয়নের নির্দেশনা।",date:t.notice2Date,output:"নোটিশ ২"},{step:4,stage:"ধাপ ৪",title:"তদন্ত কমিটি",description:"তদন্ত কমিটি গঠন ও তদন্ত সময়সীমা নির্ধারণ।",date:t.notice3Date,output:"নোটিশ ৩"},{step:5,stage:"ধাপ ৫",title:"মূল্যায়ন",description:"তদন্ত প্রতিবেদনের সারাংশ ও সুপারিশ লিপিবদ্ধ।",date:t.evaluationDate,output:"প্রতিবেদন ও সুপারিশ"},{step:6,stage:"ধাপ ৬",title:"চূড়ান্ত সিদ্ধান্ত",description:"কর্তৃপক্ষের চূড়ান্ত সিদ্ধান্ত অবহিতকরণ।",date:r,output:"নোটিশ ৪"}],y=m=>m.date?"done":"pending",j=({n:m})=>{const u=y(m);return e.jsxs("div",{className:"pf-node-box",children:[e.jsxs("div",{className:"pf-node-top",children:[e.jsx("span",{className:"pf-node-badge",children:m.step}),e.jsxs("div",{className:"pf-node-heading",children:[e.jsx("div",{className:"pf-node-stage",children:m.stage}),e.jsx("div",{className:"pf-node-title",children:m.title})]}),e.jsx("span",{className:`pf-status pf-status-${u}`,children:Dt[u]})]}),e.jsx("div",{className:"pf-node-desc",children:m.description}),e.jsxs("div",{className:"pf-node-meta",children:[e.jsxs("span",{children:[e.jsx("b",{children:"তারিখ:"})," ",m.date?`${S(m.date)} ইং`:"—"]}),e.jsx("span",{className:"pf-meta-divider"})]})]})},C=()=>e.jsxs("div",{className:"pf-arrow",children:[e.jsx("span",{className:"pf-arrow-line"}),e.jsx("span",{className:"pf-arrow-head",children:"▼"})]}),$=!!(s||i);return e.jsxs("div",{className:"pf-page",ref:f,children:[$&&e.jsxs("div",{className:"pf-toolbar",role:"toolbar","aria-label":"Print or close",children:[i&&e.jsx("button",{type:"button",className:"pf-toolbar-btn pf-toolbar-btn-close",onClick:i,children:"Close"}),s&&e.jsx("button",{type:"button",className:"pf-toolbar-btn pf-toolbar-btn-print",onClick:s,children:"Print"})]}),e.jsxs("div",{className:"pf-wrap",ref:o,children:[e.jsxs("div",{className:"pf-header",children:[t.factoryName&&e.jsx("h1",{className:"pf-co-name",children:t.factoryName}),t.factoryAddress&&e.jsx("p",{className:"pf-co-addr",children:t.factoryAddress})]}),e.jsxs("div",{className:"pf-title-bar",children:[e.jsxs("div",{children:[e.jsx("h2",{className:"pf-title",children:"শৃঙ্খলামূলক ব্যবস্থা — কার্যধারা ফ্লোচার্ট"}),e.jsx("p",{className:"pf-subtitle",children:"Case Flowchart & Status Summary"})]}),t.referenceNo&&e.jsxs("div",{className:"pf-ref-badge",children:[e.jsx("span",{className:"pf-ref-label",children:"সূত্র নং"}),e.jsx("span",{className:"pf-ref-value",children:t.referenceNo})]})]}),e.jsxs("div",{className:"pf-emp-box",children:[e.jsx("div",{className:"pf-emp-box-head",children:"কর্মীর তথ্য"}),e.jsx("div",{className:"pf-emp-col",children:e.jsx("table",{className:"pf-emp-tbl",children:e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:"নাম"}),e.jsx("td",{children:t.employeeName||"—"}),e.jsx("td",{children:"কার্ড নং"}),e.jsx("td",{children:t.cardNo||"—"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"পদবী"}),e.jsx("td",{children:t.designation||"—"}),e.jsx("td",{children:"সেকশন"}),e.jsx("td",{children:t.section||"—"})]})]})})})]}),e.jsxs("div",{className:"pf-flow",children:[e.jsx(j,{n:g[0]}),e.jsx(C,{}),e.jsx(j,{n:g[1]}),h&&e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"pf-branch-stem"}),e.jsxs("div",{className:"pf-branch-row pf-branch-row-single",children:[a&&e.jsxs("div",{className:"pf-branch-col",children:[e.jsx("div",{className:"pf-branch-label pf-branch-label-good",children:"সন্তোষজনক"}),e.jsxs("div",{className:"pf-branch-box pf-branch-box-good",children:["কেস সমাপ্ত",t.replyDate?` — ${S(t.replyDate)} ইং`:""]})]}),c&&e.jsxs("div",{className:"pf-branch-col",children:[e.jsx("div",{className:"pf-branch-label pf-branch-label-continue",children:"অসন্তোষজনক"}),e.jsx("div",{className:"pf-branch-box pf-branch-box-continue",children:"তদন্ত প্রক্রিয়া চলমান"})]})]})]}),!a&&e.jsxs(e.Fragment,{children:[e.jsx(C,{}),A.map((m,u)=>e.jsxs(Ae.Fragment,{children:[e.jsx(j,{n:m}),u<A.length-1&&e.jsx(C,{})]},m.step))]}),a&&e.jsx("div",{className:"pf-flow-end pf-flow-end-closed",children:"🏁 কেস সমাপ্ত"}),!a&&e.jsxs(e.Fragment,{children:[e.jsx(C,{}),e.jsxs("div",{className:"pf-flow-end",children:["🏁 প্রক্রিয়া সম্পন্ন",l!==null&&e.jsxs("span",{className:"pf-flow-end-days",children:[" (মোট ",L(l)," দিন)"]})]})]})]}),e.jsx("div",{className:"pf-footer",children:e.jsxs("span",{children:["প্রস্তুতের তারিখঃ ",S(new Date().toISOString().split("T")[0])," ইং"]})})]}),e.jsx("style",{children:`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap');

        .pf-page, .pf-page * { font-family: ${St}; box-sizing: border-box; }

        .pf-page {
          width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff;
          box-shadow: 0 4px 24px rgba(0,0,0,0.12); border-radius: 6px; padding: 16mm 16mm 14mm;
          position: relative;
        }
        .pf-wrap { display: flex; flex-direction: column; }

        /* ── On-screen Print/Close toolbar — pinned to the viewport
           (not the page), stays visible while the page content
           scrolls. Excluded entirely from print (see @media print
           below). ── */
        /* position: sticky (NOT fixed) — anchors the toolbar to THIS
           card's own scroll container (the modal body wrapping
           .pf-page), not the browser viewport. With 'fixed', the
           buttons floated at the literal top-right of the whole
           browser window — detached from the card, sitting over the
           dark modal backdrop / underlying page nav instead of the
           document itself, and not actually tied to whatever is
           scrolled. 'sticky' keeps it flush with the card's own
           top-right corner at rest, and only "sticks" there once the
           card scrolls past it — same fixed-while-scrolling behavior,
           but correctly scoped to the print-preview card rather than
           the whole page. */
        .pf-toolbar {
          position: sticky; top: 12px; z-index: 100;
          display: flex; justify-content: flex-end; align-items: center; gap: 10px;
          margin: 0 0 16px; width: 100%;
          padding-bottom: 12px; border-bottom: 1px solid #e5e7eb;
        }
        /* Text-label buttons matching the reference: plain gray "Close",
           bordered/emphasized "Print" — not icon-only circles. */
        .pf-toolbar-btn {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 76px; height: 34px; padding: 0 16px;
          border-radius: 4px; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: background 0.15s ease, transform 0.1s ease;
        }
        .pf-toolbar-btn:active { transform: scale(0.97); }
        .pf-toolbar-btn-close {
          background: #f1f5f9; border: 1px solid #e2e8f0; color: #334155;
        }
        .pf-toolbar-btn-close:hover { background: #e2e8f0; }
        .pf-toolbar-btn-print {
          background: #fff; border: 2px solid #1e293b; color: #1e293b;
        }
        .pf-toolbar-btn-print:hover { background: #f8fafc; }

        .pf-header { text-align: center; border-bottom: 2.5px solid #1d4ed8; padding-bottom: 8px; margin-bottom: 14px; }
        .pf-co-name { font-size: 19px; font-weight: 700; color: #1e3a5f; letter-spacing: 0.5px; margin: 0 0 3px; text-transform: uppercase; }
        .pf-co-addr { font-size: 12.5px; color: #374151; margin: 0; }

        .pf-title-bar {
          display: flex; align-items: flex-start; justify-content: space-between;
          padding-bottom: 12px; border-bottom: 1px solid #e2e8f0; margin-bottom: 18px; gap: 12px; flex-wrap: wrap;
        }
        .pf-title { font-size: 16px; font-weight: 700; margin: 0; color: #111827; letter-spacing: 0.1px; }
        .pf-subtitle { font-size: 10.5px; color: #94a3b8; margin: 2px 0 0; letter-spacing: 0.6px; text-transform: uppercase; }
        .pf-ref-badge {
          display: flex; flex-direction: column; align-items: flex-end;
          border: 1px solid #cbd5e1; border-radius: 8px; padding: 6px 12px; background: #f8fafc;
        }
        .pf-ref-label { font-size: 9.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.4px; }
        .pf-ref-value { font-size: 12px; font-weight: 700; color: #1e3a5f; margin-top: 1px; }

        .pf-emp-box { border: 1.5px solid #1e3a5f; border-radius: 6px; overflow: hidden; margin: 0 auto 22px; width: 100%; max-width: 480px; }
        .pf-emp-box-head { background: #1e3a5f; color: #fff; font-size: 11.5px; font-weight: 700; letter-spacing: 0.3px; padding: 5px 12px; }
        .pf-emp-col { padding: 8px 12px; }
        .pf-emp-tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
        .pf-emp-tbl td { padding: 3px 6px; vertical-align: top; line-height: 1.5; }
        .pf-emp-tbl td:nth-child(1), .pf-emp-tbl td:nth-child(3) { font-weight: 600; color: #475569; white-space: nowrap; width: 15%; }
        .pf-emp-tbl td:nth-child(1)::after, .pf-emp-tbl td:nth-child(3)::after { content: ':'; margin-right: 2px; }
        .pf-emp-tbl td:nth-child(2), .pf-emp-tbl td:nth-child(4) { width: 35%; }

        /* ── Flowchart — all children centered, full-width container so
           margin:auto on the fixed-max-width children actually centers
           them regardless of the page's own width. ── */
        .pf-flow { display: flex; flex-direction: column; align-items: center; width: 100%; }

        .pf-node-box {
          width: 100%; max-width: 480px; margin: 0 auto; background: #fff; border: 1.5px solid #cbd5e1; border-radius: 10px;
          padding: 12px 16px; box-shadow: 0 1px 3px rgba(15,23,42,0.05);
        }
        .pf-node-top { display: flex; align-items: flex-start; gap: 10px; }
        .pf-node-badge {
          flex-shrink: 0; width: 26px; height: 26px; border-radius: 50%; background: #1e3a5f; color: #fff;
          font-weight: 700; font-size: 12px; display: flex; align-items: center; justify-content: center;
        }
        .pf-node-heading { flex: 1; min-width: 0; }
        .pf-node-stage { font-size: 9.5px; font-weight: 700; color: #2563eb; letter-spacing: 0.4px; text-transform: uppercase; }
        .pf-node-title { font-weight: 700; font-size: 13px; color: #111827; }
        .pf-node-desc { font-size: 11px; line-height: 1.55; color: #64748b; margin: 6px 0 0 36px; }
        .pf-node-meta { display: flex; align-items: center; gap: 10px; margin: 6px 0 0 36px; font-size: 11px; color: #374151; }
        .pf-node-meta b { color: #1e293b; font-weight: 600; }
        .pf-meta-divider { width: 1px; height: 11px; background: #e2e8f0; }

        .pf-arrow { display: flex; flex-direction: column; align-items: center; padding: 4px 0; }
        .pf-arrow-line { width: 2px; height: 16px; background: #cbd5e1; }
        .pf-arrow-head { color: #94a3b8; font-size: 11px; line-height: 1; margin-top: -3px; }

        .pf-branch-stem { width: 2px; height: 14px; background: #cbd5e1; margin: 0 auto; }
        .pf-branch-row {
          display: flex; justify-content: center; gap: 20px;
          width: 100%; max-width: 480px; margin: 4px auto 6px;
        }
        /* Single-branch variant (only ONE outcome is ever shown) —
           narrower max-width so the lone box reads as centered content,
           not a half-empty two-column row. */
        .pf-branch-row-single { max-width: 300px; }
        .pf-branch-col { flex: 1; text-align: center; }
        .pf-branch-label { font-size: 11px; font-weight: 700; margin-bottom: 4px; }
        .pf-branch-label-good { color: #15803d; }
        .pf-branch-label-continue { color: #c2410c; }
        .pf-branch-box {
          border-radius: 8px; padding: 8px 10px; font-size: 10.5px; font-weight: 600; border: 1.5px solid;
        }
        .pf-branch-box-good { background: #f0fdf4; border-color: #86efac; color: #15803d; }
        .pf-branch-box-continue { background: #fff7ed; border-color: #fdba74; color: #c2410c; }

        .pf-status {
          display: inline-block; font-size: 9.5px; font-weight: 700; border-radius: 999px;
          padding: 2px 9px; white-space: nowrap; flex-shrink: 0;
        }
        .pf-status-done     { color: #15803d; background: #f0fdf4; border: 1px solid #86efac; }
        .pf-status-progress { color: #c2410c; background: #fff7ed; border: 1px solid #fdba74; }
        .pf-status-pending  { color: #64748b; background: #f1f5f9; border: 1px solid #e2e8f0; }
        .pf-status-na       { color: #94a3b8; background: #f8fafc; border: 1px dashed #e2e8f0; }

        .pf-flow-end {
          margin-top: 4px; font-size: 12.5px; font-weight: 700; color: #1e3a5f;
          background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px;
          padding: 7px 18px; text-align: center;
        }
        .pf-flow-end-closed { color: #15803d; background: #f0fdf4; border-color: #86efac; margin-top: 10px; }
        .pf-flow-end-days { font-weight: 600; color: #2563eb; }

        .pf-footer { margin-top: 22px; padding-top: 10px; border-top: 1px dashed #e2e8f0; text-align: right; font-size: 10.5px; color: #94a3b8; }

        ${ae}

        @media print {
          @page { size: A4 portrait; margin: 14mm 15mm 14mm 15mm; }
          body * { visibility: hidden !important; }
          .pf-page, .pf-page * { visibility: visible !important; }
          .pf-page {
            position: absolute !important; inset: 0 !important; width: 100% !important;
            min-height: unset !important; padding: 0 !important; margin: 0 !important;
            box-shadow: none !important; border-radius: 0 !important; background: white !important;
          }
          /* On-screen-only chrome — never part of the printed page. */
          .pf-toolbar { display: none !important; visibility: hidden !important; }
          /* Single-page guarantee: shrink the ENTIRE flow to whatever
             scale the useLayoutEffect above computed, via the
             non-standard-but-Chromium-supported 'zoom' property (this
             app's print pipeline is confirmed Chromium). 'zoom' — unlike
             'transform: scale()' — actually reflows the box at the
             smaller size, so the page genuinely stops reserving the
             original, too-tall height instead of just visually shrinking
             while still occupying (and spilling into) a second sheet.
             Falls back to 1 (no shrink) if the custom property was
             never set, e.g. this stylesheet somehow renders before the
             layout effect has run.
             Deliberately NOT paired with overflow:hidden on .pf-page —
             the height measurement this is based on is a conservative
             estimate (see the useLayoutEffect comment), not a
             guarantee. If it's ever slightly off, letting the tail
             content spill naturally onto a second page is a far better
             failure mode than silently clipping the footer or last
             node off the printout. */
          .pf-wrap { zoom: var(--pf-print-zoom, 1); }
          .pf-node-box { page-break-inside: avoid !important; }
          .pf-node-title { font-size: 10.5pt !important; }
          .pf-node-desc, .pf-node-meta { font-size: 9pt !important; }
          .pf-emp-box-head, .pf-node-badge {
            -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
          }
          .pf-status-done, .pf-status-progress, .pf-status-pending, .pf-status-na,
          .pf-branch-box-good, .pf-branch-box-continue {
            -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
          }
        }
      `})]})},Et=[{id:"showCause",label:"কারণ দর্শানো",icon:"ti-alert-triangle"},{id:"reply",label:"জবাব ও অবস্থা",icon:"ti-message-circle"},{id:"nomination",label:"প্রতিনিধি মনোনয়ন",icon:"ti-users-group"},{id:"committee",label:"তদন্ত কমিটি গঠন",icon:"ti-users"},{id:"evaluation",label:"তদন্ত প্রতিবেদন",icon:"ti-file-report"},{id:"finalDecision",label:"চূড়ান্ত সিদ্ধান্ত",icon:"ti-gavel"}],Se=15,De=96/25.4,Rt=1.15;function Ce(t){const n=t.querySelector(".pf-wrap, .nl-wrap");if(!n)return;const s=(297-Se*2)*De,i=(210-Se*2)*De,r=n.scrollHeight,a=n.scrollWidth;if(r>s*Rt)return;const c=r>s?s/r:1,h=a>i?i/a:1,l=Math.max(.85,Math.min(c,h));l<1&&(n.style.transform=`scale(${l})`,n.style.transformOrigin="top center")}function ke(t,n){return{...n,referenceNo:String(t.referenceNo??""),employeeName:String(t.employeeName??""),cardNo:String(t.cardNo??""),designation:String(t.designation??""),section:String(t.section??""),joiningDate:H(t.joiningDate)||"",showCauseDate:H(t.showCauseDate)||"",subject:ze.includes(t.subject)?t.subject:"কারণ দর্শানোর নোটিশ।",complaint:String(t.complaint??""),replyDate:H(t.replyDate)||"",replyStatus:t.replyStatus==="সন্তোষজনক"||t.replyStatus==="অসন্তোষজনক"?t.replyStatus:"",numberOfCommitteeMembers:String(t.numberOfCommitteeMembers??""),notice2Date:H(t.notice2Date)||"",committeeMembers:(()=>{try{const s=JSON.parse(String(t.committeeMembersJson??"[]"));return Array.isArray(s)?s.map((i,r)=>({slNo:Number(i.slNo??r+1),name:String(i.name??""),cardNo:String(i.cardNo??""),designation:String(i.designation??""),section:String(i.section??"")})):n.committeeMembers}catch{return n.committeeMembers}})(),notice3Date:H(t.notice3Date)||"",investigationReportSummary:String(t.investigationReportSummary??""),recommendation:String(t.recommendation??""),finalDecision:String(t.finalDecision??""),evaluationDate:H(t.evaluationDate)||"",date:H(t.date)||n.date}}function Lt(){const t=$e(),{user:n}=_e(),s=Ie("disciplinaryactions",t.id,n?.name??"unknown",1500),i=w.useRef(null),[r,a]=w.useState(Oe),[c,h]=w.useState("showCause"),[l,f]=w.useState(!1),[o,g]=w.useState(se()),[A,y]=w.useState(1),[j,C]=w.useState(!1),$=t.festivalHolidays??[];w.useEffect(()=>{g(p=>({...p,factoryName:t.nameBn,factoryAddress:t.addressBn}))},[t.id]),w.useEffect(()=>{if(s.editingId||o.referenceNo||!o.employeeName||!o.complaint)return;const p=String(new Date().getFullYear()),v=s.records.filter(T=>String(T.date??"").startsWith(p.slice(0,4))).length,z=t.referenceCode||"";g(T=>({...T,referenceNo:qe(z,v,L(p))}))},[o.employeeName,o.complaint,s.editingId]),w.useEffect(()=>{if(!j)return;const p=v=>{v.key==="Escape"&&C(!1)};return window.addEventListener("keydown",p),()=>window.removeEventListener("keydown",p)},[j]);const m=()=>{g(p=>({...se(),factoryName:p.factoryName,factoryAddress:p.factoryAddress})),h("showCause"),f(!1),s.setEditingId(null)},u=p=>{const v=(p?document.getElementById(p):null)??i.current??document.getElementById("printable-area");if(!v){window.print();return}const z=document.createElement("iframe");z.style.cssText="position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;border:none;",document.body.appendChild(z);const T=z.contentDocument,I=Array.from(document.styleSheets).map(Y=>{try{return Array.from(Y.cssRules).map(N=>N.cssText).join(`
`)}catch{return""}}).join(`
`);T.open(),T.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
      <style>@page{size:A4 portrait;margin:15mm;}body{margin:0;}${I}</style>
      <style>html,body{background:#fff !important;color:#000 !important;}</style>
      </head><body>${v.outerHTML}</body></html>`),T.close(),z.onload=()=>{const Y=T.fonts,N=()=>{Ce(T),requestAnimationFrame(()=>{requestAnimationFrame(()=>{Ce(T),z.contentWindow.focus(),z.contentWindow.print(),z.contentWindow.addEventListener("afterprint",()=>{document.body.removeChild(z)})})})};Y?.ready?Y.ready.then(()=>setTimeout(N,150)).catch(()=>setTimeout(N,200)):setTimeout(N,300)}},d=async()=>{const p=i.current??document.getElementById("printable-area");p&&await Fe({element:p,filename:`শৃঙ্খলামূলক_ব্যবস্থা_${A}_${o.employeeName.replace(/[^a-z0-9]/gi,"_")||"রেকর্ড"}`,scale:2})},x=()=>({referenceNo:o.referenceNo,employeeName:o.employeeName,cardNo:o.cardNo,designation:o.designation,section:o.section,joiningDate:o.joiningDate,showCauseDate:o.showCauseDate,subject:o.subject,complaint:o.complaint,replyDate:o.replyDate,replyStatus:o.replyStatus,numberOfCommitteeMembers:o.numberOfCommitteeMembers,notice2Date:o.notice2Date,committeeMembersJson:JSON.stringify(o.committeeMembers),notice3Date:o.notice3Date,investigationReportSummary:o.investigationReportSummary,recommendation:o.recommendation,finalDecision:o.finalDecision,evaluationDate:o.evaluationDate,date:o.date,preparedBy:r.preparedBy,preparedByDesignation:r.preparedByDesignation}),b=p=>{y(p),f(!0)},k=Number(o.numberOfCommitteeMembers)||0,_=!!(o.employeeName&&o.cardNo&&o.complaint&&o.showCauseDate),R=k>0&&!!o.notice2Date,M=o.committeeMembers.length===k&&k>0&&o.committeeMembers.every(p=>p.name.trim()!=="")&&!!o.notice3Date,D=!!(o.investigationReportSummary&&o.recommendation&&o.evaluationDate),F=!!(o.finalDecision&&o.evaluationDate),W=w.useMemo(()=>{const p=[];return _&&p.push({label:"নোটিশ ১",onClick:()=>b(1)}),R&&p.push({label:"নোটিশ ২",onClick:()=>b(2)}),M&&p.push({label:"নোটিশ ৩",onClick:()=>b(3)}),D&&p.push({label:"প্রতিবেদন দাখিল",onClick:()=>b("evaluation")}),F&&p.push({label:"নোটিশ ৪",onClick:()=>b(4)}),p.push({label:"প্রক্রিয়া দেখুন",onClick:()=>C(!0)}),p},[_,R,M,D,F]);return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`
        ${ae}
        ${We}

        .da-flow-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(15, 23, 42, 0.55);
          display: flex; align-items: flex-start; justify-content: center;
          overflow-y: auto; padding: 32px 16px;
        }
        .da-flow-panel {
          position: relative; width: 100%; max-width: 850px;
        }
      `}),e.jsxs(Le,{moduleName:"শৃঙ্খলামূলক ব্যবস্থা",moduleNameEn:"Disciplinary Action",date:o.date,onDateChange:p=>g(v=>({...v,date:p})),steps:Et,activeStep:l?"":c,onStepChange:p=>{f(!1),h(p)},billItems:W,isBillActive:l,onSave:async()=>{const p=x(),v=s.editingId?await s.update(s.editingId,p):await s.save(p);return v&&m(),v},isSaving:s.isSaving,configured:s.configured,adapterName:s.adapterName,saveDisabled:!o.employeeName||!o.cardNo,editingId:s.editingId,onCancelEdit:m,onReset:m,onUpdate:p=>{s.setEditingId(String(p.id??"")),g(v=>ke(p,v)),h("showCause"),f(!1)},updateModule:"disciplinaryactions",updateLabel:"শৃঙ্খলামূলক ব্যবস্থা খুঁজুন",updateSearchPlaceholder:"কর্মীর নাম বা আইডি দিয়ে খুঁজুন...",calcRows:[{label:"কর্মী",value:o.employeeName||"—"},{label:"জবাবের অবস্থা",value:o.replyStatus||"—"},{label:"কমিটি সদস্য",value:o.replyStatus==="অসন্তোষজনক"?`${o.numberOfCommitteeMembers||0} জন`:"—"}],records:s.records,isLoading:s.isLoading,onLoadRecord:p=>{s.setEditingId(String(p.id??"")),g(v=>ke(p,v)),h("showCause"),f(!1),window.scrollTo({top:0,behavior:"smooth"})},onDeleteRecord:s.remove,onReload:s.reload,auth:r,onAuthChange:a,onPrint:u,onPDF:d,lang:"bn",children:[!l&&c==="showCause"&&e.jsx(it,{data:o,setData:g,onGenerateNotice:()=>b(1)}),!l&&c==="reply"&&e.jsx(st,{data:o,setData:g}),!l&&c==="nomination"&&e.jsx(at,{data:o,setData:g,onGenerateNotice:()=>b(2)}),!l&&c==="committee"&&e.jsx(pt,{data:o,setData:g,festivalHolidays:$,onGenerateNotice:()=>b(3)}),!l&&c==="evaluation"&&e.jsx(ft,{data:o,setData:g,onGenerateOutput:()=>b("evaluation")}),!l&&c==="finalDecision"&&e.jsx(xt,{data:o,setData:g,festivalHolidays:$,onGenerateNotice4:()=>b(4)}),l&&e.jsx("div",{id:"printable-area",ref:i,children:e.jsx(Nt,{data:o,notice:A,authorization:r,festivalHolidays:$})})]}),j&&e.jsx("div",{className:"da-flow-overlay",onClick:()=>C(!1),children:e.jsx("div",{className:"da-flow-panel",onClick:p=>p.stopPropagation(),children:e.jsx("div",{id:"process-flow-print-area",children:e.jsx(Tt,{data:o,festivalHolidays:$,onPrint:()=>u("process-flow-print-area"),onClose:()=>C(!1)})})})})]})}export{Lt as default};
