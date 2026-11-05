const r="'Noto Sans Bengali', Arial, sans-serif",i=34,e={fontSize:12.5,fontWeight:600,fontFamily:r,color:"#1e293b",display:"block",marginBottom:4},n={width:"100%",padding:"7px 10px",border:"1px solid #cbd5e1",borderRadius:8,fontSize:12.5,fontFamily:r,background:"#fff",color:"#1e293b",outline:"none",boxSizing:"border-box"},t={...n,background:"#f1f5f9",color:"#0f172a",fontWeight:600},a={...n,minHeight:58,resize:"vertical",lineHeight:1.4},d={background:"#fff",borderRadius:10,border:"1px solid #e2e8f0",padding:14,marginBottom:12,boxSizing:"border-box"},l={fontSize:13.5,fontWeight:700,fontFamily:r,color:"#1e3a5f"},s=o=>({background:o,color:"#fff",border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:r}),f=(o="secondary")=>({display:"inline-flex",alignItems:"center",gap:6,height:32,padding:"0 12px",borderRadius:8,fontSize:12.5,fontWeight:600,fontFamily:r,cursor:"pointer",whiteSpace:"nowrap",border:`1px solid ${o==="primary"?"#1d4ed8":o==="danger"?"#fecaca":"#cbd5e1"}`,background:o==="primary"?"#2563eb":o==="danger"?"#fff5f5":"#fff",color:o==="primary"?"#fff":o==="danger"?"#b91c1c":"#334155",boxShadow:o==="primary"?"0 1px 2px rgba(37,99,235,0.35)":"none"}),p={padding:"7px 8px",fontSize:11,fontWeight:700,fontFamily:r,color:"#374151",background:"#f1f5f9",textAlign:"left",verticalAlign:"bottom",boxShadow:"inset 0 -1px 0 #e2e8f0",whiteSpace:"nowrap"},g={padding:"5px 6px",borderBottom:"1px solid #e2e8f0",fontSize:12.5,fontFamily:r,color:"#1e293b",verticalAlign:"top"},c=o=>({flexShrink:0,padding:"2px 5px",cursor:"pointer",borderRadius:5,fontSize:11,fontWeight:700,border:`1px solid ${o?"#93c5fd":"transparent"}`,background:o?"#dbeafe":"transparent",color:o?"#1d4ed8":"#64748b"}),m=`
  .lw-form { container-type: inline-size; }
  .lw-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px 14px; align-items: start; }
  .lw-grid > .s2 { grid-column: span 2; }
  .lw-grid > .s3 { grid-column: span 3; }
  .lw-grid > .s4 { grid-column: span 4; }
  @container (max-width: 760px) {
    .lw-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .lw-grid > .s3, .lw-grid > .s4 { grid-column: span 2; }
  }
  @container (max-width: 480px) {
    .lw-grid { grid-template-columns: minmax(0, 1fr); }
    .lw-grid > .s2, .lw-grid > .s3, .lw-grid > .s4 { grid-column: span 1; }
  }
`;export{i as C,m as F,l as a,s as b,d as c,g as d,f as e,r as f,a as g,n as i,e as l,c as m,t as r,p as t};
