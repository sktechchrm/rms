// ─────────────────────────────────────────────────────────────────────────────
// Compliance Audit — types, standards list, shared Statement filters
// Path: src/components/modules/complianceAudit/types.ts
//
// ONE module, TWO audit types ('Internal' | 'External for Supplier').
// Auditing Areas: the sections A–D of the Complete 100-point Code of Conduct checklist + E (Better Work Cluster).
// NC Ref = a checklist point (+ its standard principles); NC ID is generated from it.
// NC items carry NC ID + NC Ref (the old "Non-Compliance Number" is read as NC ID).
// ─────────────────────────────────────────────────────────────────────────────

import type { DbRecord } from '../../../database/DatabaseFactory';

export type AuditCategory = 'Internal' | 'External for Supplier';
export const AUDIT_CATEGORY_OPTIONS: AuditCategory[] = ['Internal', 'External for Supplier'];

export type AuditRound = 'Initial' | '1st Follow-Up' | '2nd Follow-Up' | '3rd Follow-Up' | '4th Follow-Up';
export const AUDIT_ROUND_OPTIONS: AuditRound[] = ['Initial', '1st Follow-Up', '2nd Follow-Up', '3rd Follow-Up', '4th Follow-Up'];

// ─── Auditing areas = the 4 sections (A–D) of the Complete 100-point checklist ──

export interface ChecklistPoint { sl: number; point: string; principle: string; area: string; group?: string; }
interface ChecklistArea { code: string; name: string; points: [number, string, string, string?][]; }

// [SL, Code of Conduct Point, Principle No. of Standard, (optional) sub-group]
// Area E = the Better Work CAT assessment questions (ID: question → reference), grouped by cluster.
export const CHECKLIST_AREAS: ChecklistArea[] = [
  { code: 'A', name: "Legal compliance, management and worker rights", points: [
    [1, "Legal Compliance", "BW: Cross-cutting; BSCI PA1; WRAP P1; ETI applicable clauses"],
    [2, "Social Compliance Management System", "BSCI PA1; SA8000 Management System; ISO 9001/14001/45001"],
    [3, "Management Commitment", "BSCI PA1; SA8000 Management System; ISO Clause 5"],
    [4, "Worker Involvement", "BW C4/C7; ILO C87/C98/C155; BSCI PA2; SA8000"],
    [5, "Freedom of Association", "BW C4; ILO C87; BSCI PA3; WRAP P6; ETI C2"],
    [6, "Union Operations and Protection of Representatives", "BW C4; ILO C87/C98; BSCI PA3; ETI C2"],
    [7, "Collective Bargaining", "BW C4; ILO C98; BSCI PA3; WRAP P6; ETI C2"],
    [8, "No Child Labour", "BW C1; ILO C138/C182; BSCI PA8; WRAP P3; ETI C4"],
    [9, "Young Worker Protection", "BW C1; ILO C138/C182; BSCI PA9; WRAP P3; ETI C4"],
    [10, "No Forced Labour", "BW C3; ILO C29/C105/P029; BSCI PA11; WRAP P2; ETI C1"],
    [11, "No Human Trafficking", "BW C3; ILO C29/P029; BSCI PA11; WRAP P2; ETI C1"],
    [12, "No Bonded Labour", "BW C3; ILO C29/C105; BSCI PA11; WRAP P2; ETI C1"],
    [13, "No Prison Labour or Coercion", "BW C3; ILO C29/C105; BSCI PA11; WRAP P2"],
    [14, "No Discrimination", "BW C2; ILO C111; BSCI PA4; WRAP P7; ETI C7"],
    [15, "Equal Remuneration", "BW C2/C5; ILO C100; BSCI PA4/PA5; ETI C5/C7"],
    [16, "No Harassment or Abuse", "BW C2/C6; ILO C190; BSCI PA4; WRAP P4; ETI C9"],
    [17, "Fair Recruitment", "BW C3/C6; ILO C29/P029; BSCI PA10/PA11; SA8000"],
    [18, "Employment Contracts", "BW C6; BSCI PA10; WRAP P1; ETI C8"],
    [19, "Accurate Personnel Records", "BW C6; BSCI PA1/PA10; WRAP P1; ETI C8"],
    [20, "Wages and Benefits", "BW C5; ILO C95/C131; BSCI PA5; WRAP P5; ETI C5"],
    [21, "Minimum Wage Compliance", "BW C5; ILO C131; applicable Bangladesh minimum-wage orders; BSCI PA5; WRAP P5"],
    [22, "Overtime Payment", "BW C5/C8; applicable Bangladesh labour law; BSCI PA5/PA6; WRAP P5/P6; ETI C5/C6"],
    [23, "Timely Wage Payment", "BW C5; ILO C95; BSCI PA5; WRAP P5; ETI C5"],
    [24, "Wage Information, Payslips and Deductions", "BW C5; ILO C95; BSCI PA5; WRAP P5; ETI C5"],
    [25, "Premium Pay and Other Benefits", "BW C5; applicable Bangladesh labour law; BSCI PA5; WRAP P5"],
    [26, "Working Hours", "BW C8; ILO C1, where applicable; BSCI PA6; WRAP P6; ETI C6"],
    [27, "Weekly Rest and Holidays", "BW C8; ILO C14, where applicable; BSCI PA6; WRAP P6; ETI C6"],
    [28, "Leave Entitlements", "BW C5/C8; applicable Bangladesh labour law; BSCI PA5/PA6; ETI C5/C6"],
    [29, "Maternity Protection", "BW C2/C5/C6; ILO C183 as a reference; applicable Bangladesh labour law"],
    [30, "Social Security and Statutory Benefits", "BW C5; applicable Bangladesh labour law; BSCI PA5; WRAP P5"],
    [31, "Termination and Final Settlement", "BW C6; ILO C158 as a reference; applicable Bangladesh labour law; BSCI PA10; ETI C8"],
    [32, "Grievance Mechanism", "BW C6; ILO C190 as applicable; BSCI PA2; SA8000 Management System"],
    [33, "Disciplinary Procedure", "BW C6; applicable Bangladesh labour law; WRAP P4; ETI C9"],
  ] },
  { code: 'B', name: "Occupational health and safety", points: [
    [34, "Occupational Health and Safety Management", "BW C7; ILO C155/C187; BSCI PA7; WRAP P8; ETI C3; ISO 45001"],
    [35, "Hazard Identification and Risk Assessment", "BW C7; ILO C155/C187; BSCI PA7; ISO 45001 Clauses 6 and 8"],
    [36, "Fire Safety and Firefighting Equipment", "BW C7; ILO C155; BSCI PA7; WRAP P8; ETI C3"],
    [37, "Building and Structural Safety", "BW C7; ILO C155; BSCI PA7; WRAP P8; applicable building laws"],
    [38, "Electrical Safety", "BW C7; ILO C155; BSCI PA7; ISO 45001"],
    [39, "Machinery Safety and Machine Guards", "BW C7; ILO C119; BSCI PA7; WRAP P8; ISO 45001"],
    [40, "Chemical Management and SDS", "BW C7; ILO C170; BSCI PA7/PA12; WRAP P8/P9; ISO 14001"],
    [41, "Personal Protective Equipment", "BW C7; ILO C155; BSCI PA7; WRAP P8; ISO 45001"],
    [42, "First Aid and Medical Facilities", "BW C7; ILO C161; BSCI PA7; WRAP P8"],
    [43, "Drinking Water and Sanitation", "BW C7; ILO C155; BSCI PA7; WRAP P8"],
    [44, "Ventilation, Lighting and Thermal Conditions", "BW C7; ILO C155; BSCI PA7; ISO 45001"],
    [45, "Ergonomics and Workplace Welfare", "BW C7; ILO C155; BSCI PA7; ISO 45001"],
    [46, "Emergency Preparedness and Evacuation", "BW C7; ILO C155/C187; BSCI PA7; WRAP P8; ISO 45001"],
    [47, "Worker Accommodation, Where Provided", "BW C7; applicable ILO guidance and national law; BSCI PA7; WRAP P8"],
    [48, "Occupational Accident and Incident Reporting", "BW C7; ILO C155/C187; BSCI PA7; ISO 45001"],
    [49, "Worker Consultation on Safety", "BW C7; ILO C155; BSCI PA7; ISO 45001"],
  ] },
  { code: 'C', name: "Environment, ethics and responsible business", points: [
    [50, "Environmental Management", "BSCI PA12; WRAP P9; SMETA Environmental Pillar; ISO 14001"],
    [51, "Waste Segregation and Disposal", "BSCI PA12; WRAP P9; SMETA Environmental Pillar; ISO 14001"],
    [52, "Wastewater and ETP Management", "BSCI PA12; WRAP P9; SMETA Environmental Pillar; ISO 14001"],
    [53, "Air Emissions and Energy Management", "BSCI PA12; WRAP P9; SMETA Environmental Pillar; ISO 14001/50001"],
    [54, "Water Management and Conservation", "BSCI PA12; WRAP P9; SMETA Environmental Pillar; ISO 14001"],
    [55, "Business Ethics", "BSCI PA13; WRAP P10; SMETA Business Ethics Pillar"],
    [56, "Anti-Bribery and Corruption", "BSCI PA13; WRAP P10; SMETA Business Ethics Pillar; ISO 37301"],
    [57, "Accurate Records and Transparency", "BSCI PA1/PA13; WRAP P1/P10/P11; buyer requirements"],
    [58, "Subcontracting and Supply-Chain Control", "BSCI PA1; WRAP P1; ETI C8; buyer requirements"],
    [59, "Confidentiality and Data Protection", "Applicable privacy laws; SA8000 privacy requirements; buyer requirements"],
    [60, "Business Continuity and Risk Management", "ISO 9001/14001/45001; applicable CTPAT risk-assessment criteria"],
    [61, "Worker Training and Awareness", "BSCI PA1/PA7; WRAP P8; ETI C3; ISO 45001 Clause 7"],
    [62, "Monitoring and Corrective Action", "BSCI PA1; SMETA corrective-action process; ISO Clauses 9\u201310"],
    [63, "Document Control and Record Retention", "BSCI PA1; ISO 9001/14001/45001 Clause 7.5"],
    [64, "Continual Improvement and Management Review", "BSCI PA1; SA8000 Management System; ISO Clauses 9\u201310"],
    [65, "Pregnancy and Nursing Worker Protection", "BW C2/C7; ILO C183 as a reference; applicable Bangladesh labour law"],
    [66, "Workplace Violence and Harassment Prevention", "BW C2/C6; ILO C190; WRAP P4; buyer requirements"],
    [67, "Recruitment Fees and Worker-Paid Costs", "BW C3/C6; ILO C29/P029; BSCI PA11; SA8000"],
    [68, "Responsible Purchasing Practices", "OECD Responsible Business Conduct Guidance; buyer requirements; applicable BSCI supply-chain expectations"],
    [69, "Product Safety and Restricted Substances", "Buyer requirements; ZDHC; OEKO-TEX requirements where adopted"],
    [70, "Traceability and Material Claims", "GOTS; GRS; RCS; OCS, where applicable; buyer requirements"],
    [71, "Energy, Carbon and Climate Reporting", "ISO 14001/50001; buyer environmental requirements"],
    [72, "Supplier Evaluation and Monitoring", "BSCI PA1; WRAP P1; ISO 9001 supplier-control requirements"],
    [73, "Audit Integrity and Non-Retaliation", "BSCI PA1/PA2; SA8000 Management System; buyer requirements"],
  ] },
  { code: 'D', name: "CTPAT \u2014 Supply-chain and cargo security", points: [
    [74, "Supply Chain Security Risk Assessment", "CTPAT \u2014 Risk Assessment; WRAP P12"],
    [75, "Written Security Procedures and Responsibilities", "CTPAT \u2014 Security Management; WRAP P12"],
    [76, "Business Partner Security Verification", "CTPAT \u2014 Business Partners"],
    [77, "Container and Trailer Inspection", "CTPAT \u2014 Conveyance and Instruments of International Traffic Security"],
    [78, "Container Seal Control and Seal Verification", "CTPAT \u2014 Procedural Security; applicable seal requirements"],
    [79, "Container Loading Supervision and Documentation", "CTPAT \u2014 Procedural Security"],
    [80, "Physical Security of Buildings and Perimeters", "CTPAT \u2014 Physical Security; WRAP P12"],
    [81, "Access Control for Employees and Visitors", "CTPAT \u2014 Physical Access Controls"],
    [82, "Visitor Identification and Escort", "CTPAT \u2014 Physical Access Controls"],
    [83, "Employee Identification and Access Privileges", "CTPAT \u2014 Physical Access Controls"],
    [84, "CCTV Coverage and Footage Retention", "CTPAT \u2014 Physical Security; WRAP P12"],
    [85, "Security of Cargo Handling and Storage Areas", "CTPAT \u2014 Physical Security and Procedural Security"],
    [86, "Protection Against Unauthorized Cargo or Contraband", "CTPAT \u2014 Procedural Security"],
    [87, "Shipping Documents and Manifest Accuracy", "CTPAT \u2014 Procedural Security"],
    [88, "Export Shipment Reconciliation", "CTPAT \u2014 Procedural Security"],
    [89, "Security of Empty Containers and Trailers", "CTPAT \u2014 Conveyance and Instruments of International Traffic Security"],
    [90, "Security Awareness Training", "CTPAT \u2014 Security Training and Threat Awareness"],
    [91, "Employee Screening and Personnel Security", "CTPAT \u2014 Personnel Security"],
    [92, "Reporting and Investigating Security Incidents", "CTPAT \u2014 Security Management and Incident Reporting"],
    [93, "Cybersecurity and Protection of Information Systems", "CTPAT \u2014 Cybersecurity"],
    [94, "Security of Keys, Locks, Seals and Access Devices", "CTPAT \u2014 Physical Access Controls and Procedural Security"],
    [95, "Security of Loading Docks and Dispatch Areas", "CTPAT \u2014 Physical Security and Procedural Security"],
    [96, "Security of Subcontractors and Logistics Providers", "CTPAT \u2014 Business Partners"],
    [97, "Security Corrective Action and Periodic Review", "CTPAT \u2014 Risk Assessment and Security Management"],
    [98, "Container/Trailer Tampering Detection and Escalation", "CTPAT \u2014 Conveyance Security and Procedural Security"],
    [99, "Security Incident Response and Emergency Communication", "CTPAT \u2014 Security Management; Incident Reporting"],
    [100, "Security Programme Review and Continuous Improvement", "CTPAT \u2014 Risk Assessment and Security Management; WRAP P12"],
  ] },
  { code: 'E', name: "Better Work Cluster", points: [
    [1, "CL-01: কারখানায় আইনগত ন্যূনতম বয়সের নিচে কোনো কর্মী নিয়োজিত আছেন কি?", "ILO C138; BLA", "Cluster 1 · Child Labour"],
    [2, "CL-02: নিয়োগের আগে প্রত্যেক কর্মীর বয়স যাচাইয়ের নির্ভরযোগ্য পদ্ধতি অনুসরণ করা হয় কি?", "ILO C138; R146", "Cluster 1 · Child Labour"],
    [3, "CL-03: বয়স যাচাইয়ের জন্য জন্মনিবন্ধন, জাতীয় পরিচয়পত্র, শিক্ষাগত সনদ বা গ্রহণযোগ্য প্রমাণপত্র পরীক্ষা করা হয় কি?", "ILO C138; BLA", "Cluster 1 · Child Labour"],
    [4, "CL-04: কর্মীর বয়সসংক্রান্ত তথ্য ব্যক্তিগত ফাইলে সংরক্ষণ করা হয় কি?", "ILO C138; BLA", "Cluster 1 · Child Labour"],
    [5, "CL-05: ১৮ বছরের নিচে কর্মী থাকলে তাদের পৃথক তালিকা বা রেজিস্টার সংরক্ষণ করা হয় কি?", "ILO C138; R146", "Cluster 1 · Child Labour"],
    [6, "CL-06: কোনো শিশু বা কিশোর কর্মীকে বিপজ্জনক কাজে নিয়োজিত করা হয় কি?", "ILO C182; C138", "Cluster 1 · Child Labour"],
    [7, "CL-07: কিশোর কর্মীদের কাজের ধরন, কর্মঘণ্টা ও কর্মপরিবেশ আইন অনুযায়ী নিয়ন্ত্রণ করা হয় কি?", "ILO C138; R146; BLA", "Cluster 1 · Child Labour"],
    [8, "CL-08: কিশোর কর্মীদের রাতের কাজ ও অতিরিক্ত কর্মঘণ্টা সংক্রান্ত বিধিনিষেধ অনুসরণ করা হয় কি?", "ILO C138; BLA", "Cluster 1 · Child Labour"],
    [9, "CL-09: কিশোর কর্মীদের স্বাস্থ্য পরীক্ষা বা আইন অনুযায়ী প্রয়োজনীয় সক্ষমতা যাচাই করা হয় কি?", "ILO C138; BLA", "Cluster 1 · Child Labour"],
    [10, "CL-10: শিশুশ্রম শনাক্ত হলে কর্মীকে সুরক্ষা, পুনর্বাসন ও প্রয়োজনীয় প্রতিকার দেওয়ার লিখিত পদ্ধতি রয়েছে কি?", "ILO C182; C138", "Cluster 1 · Child Labour"],
    [11, "CL-11: নিয়োগকারী সংস্থা বা তৃতীয় পক্ষের মাধ্যমে শিশুশ্রম প্রবেশের ঝুঁকি নিয়ন্ত্রণ করা হয় কি?", "ILO C138; C182", "Cluster 1 · Child Labour"],
    [12, "DI-01: নিয়োগ, পদোন্নতি, চাকরির শর্ত ও চাকরি অবসানের ক্ষেত্রে জাতি, বর্ণ বা সামাজিক উৎসের ভিত্তিতে বৈষম্য করা হয় কি?", "ILO C111", "Cluster 2 · Discrimination"],
    [13, "DI-02: নিয়োগ বিজ্ঞপ্তি বা আবেদনপত্রে বৈষম্যমূলক শর্ত ব্যবহার করা হয় কি?", "ILO C111", "Cluster 2 · Discrimination"],
    [14, "DI-03: ধর্মীয় বিশ্বাস বা রাজনৈতিক মতামতের কারণে কোনো কর্মীকে বৈষম্যের শিকার হতে হয় কি?", "ILO C111", "Cluster 2 · Discrimination"],
    [15, "DI-04: নারী ও পুরুষ কর্মীদের নিয়োগ, পদোন্নতি ও প্রশিক্ষণের সুযোগ সমানভাবে দেওয়া হয় কি?", "ILO C111; C100", "Cluster 2 · Discrimination"],
    [16, "DI-05: সমমূল্যের কাজের জন্য নারী ও পুরুষ কর্মীদের সমান পারিশ্রমিক দেওয়া হয় কি?", "ILO C100", "Cluster 2 · Discrimination"],
    [17, "DI-06: গর্ভাবস্থা বা মাতৃত্বের কারণে কোনো নারী কর্মীকে নিয়োগ, পদোন্নতি বা চাকরিতে বৈষম্যের শিকার হতে হয় কি?", "ILO C183; C111", "Cluster 2 · Discrimination"],
    [18, "DI-07: নিয়োগের ক্ষেত্রে অপ্রয়োজনীয় গর্ভধারণ পরীক্ষা বা বৈষম্যমূলক স্বাস্থ্য পরীক্ষা করা হয় কি?", "ILO C111; C183", "Cluster 2 · Discrimination"],
    [19, "DI-08: বিবাহিত বা অবিবাহিত হওয়ার কারণে কোনো কর্মীর সঙ্গে বৈষম্য করা হয় কি?", "ILO C111; প্রযোজ্য জাতীয় আইন", "Cluster 2 · Discrimination"],
    [20, "DI-09: প্রতিবন্ধী কর্মীদের ক্ষেত্রে অযৌক্তিক বৈষম্য বা সুযোগ বঞ্চিত করা হয় কি?", "ILO C111; C159", "Cluster 2 · Discrimination"],
    [21, "DI-10: বয়স, স্বাস্থ্যগত অবস্থা, HIV/AIDS অবস্থা বা অন্যান্য প্রাসঙ্গিক কারণে কর্মীদের প্রতি বৈষম্য করা হয় কি?", "ILO C111; প্রযোজ্য জাতীয় আইন", "Cluster 2 · Discrimination"],
    [22, "DI-11: কর্মক্ষেত্রে যৌন হয়রানি, মৌখিক নির্যাতন, অশালীন আচরণ বা অপমানজনক মন্তব্য প্রতিরোধে কার্যকর ব্যবস্থা রয়েছে কি?", "ILO C190; BLA ও প্রযোজ্য নির্দেশনা", "Cluster 2 · Discrimination"],
    [23, "DI-12: যৌন হয়রানি ও বৈষম্য সংক্রান্ত অভিযোগ গ্রহণের গোপনীয় ব্যবস্থা রয়েছে কি?", "ILO C190; প্রযোজ্য নির্দেশনা", "Cluster 2 · Discrimination"],
    [24, "DI-13: বৈষম্য বা হয়রানির অভিযোগ নিরপেক্ষভাবে তদন্ত ও নিষ্পত্তি করা হয় কি?", "ILO C190; প্রযোজ্য নির্দেশনা", "Cluster 2 · Discrimination"],
    [25, "DI-14: অভিযোগকারী বা সাক্ষীকে প্রতিশোধমূলক আচরণ থেকে সুরক্ষা দেওয়া হয় কি?", "ILO C111; C190", "Cluster 2 · Discrimination"],
    [26, "FL-01: কর্মীরা স্বাধীন ইচ্ছায় এবং সম্মতির ভিত্তিতে চাকরিতে যোগদান করেন কি?", "ILO C29; C105", "Cluster 3 · Forced Labour"],
    [27, "FL-02: কর্মীদের চাকরিতে যোগদানের জন্য কোনো ধরনের ভয়ভীতি, হুমকি বা চাপ প্রয়োগ করা হয় কি?", "ILO C29; C105", "Cluster 3 · Forced Labour"],
    [28, "FL-03: কর্মীদের মূল জাতীয় পরিচয়পত্র, পাসপোর্ট বা ব্যক্তিগত কাগজপত্র জোরপূর্বক আটকে রাখা হয় কি?", "ILO C29", "Cluster 3 · Forced Labour"],
    [29, "FL-04: কর্মীরা কর্মঘণ্টা শেষে কারখানা ত্যাগ করতে স্বাধীন কি?", "ILO C29", "Cluster 3 · Forced Labour"],
    [30, "FL-05: কর্মীরা আইন ও চুক্তি অনুযায়ী চাকরি থেকে পদত্যাগ করতে পারেন কি?", "ILO C29; C158", "Cluster 3 · Forced Labour"],
    [31, "FL-06: কর্মীদের কাছ থেকে নিয়োগ ফি, জামানত বা অননুমোদিত অর্থ আদায় করা হয় কি?", "ILO C29; প্রযোজ্য জাতীয় আইন", "Cluster 3 · Forced Labour"],
    [32, "FL-07: কর্মীদের ঋণ বা আর্থিক দায়ের মাধ্যমে জোরপূর্বক কাজে নিয়োজিত রাখা হয় কি?", "ILO C29; C105", "Cluster 3 · Forced Labour"],
    [33, "FL-08: বেতন বা মজুরি জোরপূর্বক আটকে রেখে কর্মীদের কাজ করতে বাধ্য করা হয় কি?", "ILO C29; C95", "Cluster 3 · Forced Labour"],
    [34, "FL-09: ওভারটাইমে কাজ করতে অস্বীকৃতি জানালে কর্মীকে হুমকি, শাস্তি বা হয়রানি করা হয় কি?", "ILO C29; C105; BLA", "Cluster 3 · Forced Labour"],
    [35, "FL-10: কর্মীদের স্বাধীনভাবে কর্মস্থলে প্রবেশ ও বের হওয়ার সুযোগ রয়েছে কি?", "ILO C29", "Cluster 3 · Forced Labour"],
    [36, "FL-11: কর্মীদের শারীরিক শাস্তি, মানসিক নির্যাতন বা ভয়ভীতি প্রদর্শনের মাধ্যমে কাজ করানো হয় কি?", "ILO C29; C105", "Cluster 3 · Forced Labour"],
    [37, "FL-12: কোনো বন্দি বা কারাবন্দি শ্রমিককে বেআইনিভাবে বা জোরপূর্বক কাজে নিয়োজিত করা হয় কি?", "ILO C29; C105", "Cluster 3 · Forced Labour"],
    [38, "FL-13: নিরাপত্তাকর্মী বা সুপারভাইজারদের মাধ্যমে কর্মীদের চলাচল বা পদত্যাগের স্বাধীনতা অযৌক্তিকভাবে সীমিত করা হয় কি?", "ILO C29", "Cluster 3 · Forced Labour"],
    [39, "FL-14: জোরপূর্বক শ্রমের ঝুঁকি শনাক্ত ও প্রতিকারের জন্য লিখিত নীতিমালা রয়েছে কি?", "ILO C29; C105", "Cluster 3 · Forced Labour"],
    [40, "FOA-01: কর্মীরা আইন অনুযায়ী শ্রমিক সংগঠন বা ট্রেড ইউনিয়ন গঠন ও তাতে যোগদানের স্বাধীনতা ভোগ করেন কি?", "ILO C87", "Cluster 4 · Freedom of Association and Collective Bargaining"],
    [41, "FOA-02: কর্মীরা কোনো সংগঠনে যোগ না দেওয়ার স্বাধীনতাও ভোগ করেন কি?", "ILO C87", "Cluster 4 · Freedom of Association and Collective Bargaining"],
    [42, "FOA-03: ট্রেড ইউনিয়ন গঠন বা পরিচালনার ক্ষেত্রে ব্যবস্থাপনা অযৌক্তিক হস্তক্ষেপ করে কি?", "ILO C87; C98", "Cluster 4 · Freedom of Association and Collective Bargaining"],
    [43, "FOA-04: শ্রমিক প্রতিনিধি বা ইউনিয়ন নেতাদের বিরুদ্ধে বৈষম্য বা প্রতিশোধমূলক ব্যবস্থা নেওয়া হয় কি?", "ILO C98", "Cluster 4 · Freedom of Association and Collective Bargaining"],
    [44, "FOA-05: শ্রমিক প্রতিনিধিদের আইনসম্মত কার্যক্রম পরিচালনায় প্রয়োজনীয় সুযোগ দেওয়া হয় কি?", "ILO C135; C98", "Cluster 4 · Freedom of Association and Collective Bargaining"],
    [45, "FOA-06: ইউনিয়ন বা শ্রমিক প্রতিনিধিদের সঙ্গে নিয়মিত আলোচনা ও যোগাযোগ করা হয় কি?", "ILO C98; C135", "Cluster 4 · Freedom of Association and Collective Bargaining"],
    [46, "FOA-07: শ্রমিক সংগঠনের কার্যক্রম, সদস্যপদ ও নেতৃত্ব নির্বাচন স্বাধীনভাবে পরিচালিত হয় কি?", "ILO C87; C98", "Cluster 4 · Freedom of Association and Collective Bargaining"],
    [47, "FOA-08: শ্রমিক সংগঠনের নিবন্ধন ও কার্যক্রম প্রযোজ্য আইন অনুযায়ী পরিচালিত হয় কি?", "ILO C87; BLA", "Cluster 4 · Freedom of Association and Collective Bargaining"],
    [48, "FOA-09: শ্রমিক প্রতিনিধিদের সঙ্গে যৌথ দরকষাকষি বা Collective Bargaining-এর সুযোগ দেওয়া হয় কি?", "ILO C98", "Cluster 4 · Freedom of Association and Collective Bargaining"],
    [49, "FOA-10: কার্যকর Collective Bargaining Agreement (CBA) থাকলে তার শর্তাবলি বাস্তবায়ন করা হয় কি?", "ILO C98; BLA", "Cluster 4 · Freedom of Association and Collective Bargaining"],
    [50, "FOA-11: শ্রমিক প্রতিনিধিদের সঙ্গে আলোচনা বা দরকষাকষির কারণে কোনো কর্মীকে শাস্তি দেওয়া হয় কি?", "ILO C98", "Cluster 4 · Freedom of Association and Collective Bargaining"],
    [51, "FOA-12: আইনসম্মত ধর্মঘট বা শ্রমিক আন্দোলনের ক্ষেত্রে প্রযোজ্য আইনি প্রক্রিয়া অনুসরণ করা হয় কি?", "ILO C87; C98; BLA", "Cluster 4 · Freedom of Association and Collective Bargaining"],
    [52, "FOA-13: শ্রমিক প্রতিনিধিদের সঙ্গে আলোচনা ও সিদ্ধান্তের রেকর্ড সংরক্ষণ করা হয় কি?", "ILO C98; BLA", "Cluster 4 · Freedom of Association and Collective Bargaining"],
    [53, "OSH-01: কারখানায় লিখিত Occupational Safety and Health (OSH) নীতিমালা রয়েছে কি?", "ILO C155; C187", "Cluster 5 · Occupational Safety and Health"],
    [54, "OSH-02: নিয়মিত কর্মক্ষেত্রের ঝুঁকি মূল্যায়ন (Risk Assessment) করা হয় কি?", "ILO C155; C187", "Cluster 5 · Occupational Safety and Health"],
    [55, "OSH-03: ঝুঁকি মূল্যায়নের ভিত্তিতে প্রয়োজনীয় প্রতিরোধমূলক ব্যবস্থা গ্রহণ করা হয় কি?", "ILO C155", "Cluster 5 · Occupational Safety and Health"],
    [56, "OSH-04: কার্যকর OSH Committee গঠন ও নিয়মিত সভা পরিচালনা করা হয় কি?", "ILO C155; BLA", "Cluster 5 · Occupational Safety and Health"],
    [57, "OSH-05: OSH Committee-এর সভার কার্যবিবরণী, সিদ্ধান্ত ও বাস্তবায়ন রেকর্ড সংরক্ষণ করা হয় কি?", "ILO C155; BLA", "Cluster 5 · Occupational Safety and Health"],
    [58, "OSH-06: কর্মীদের স্বাস্থ্য ও নিরাপত্তা বিষয়ে নিয়মিত প্রশিক্ষণ দেওয়া হয় কি?", "ILO C155", "Cluster 5 · Occupational Safety and Health"],
    [59, "OSH-07: কর্মক্ষেত্রে দুর্ঘটনা, আঘাত ও পেশাগত অসুস্থতার রেকর্ড সংরক্ষণ করা হয় কি?", "ILO C155", "Cluster 5 · Occupational Safety and Health"],
    [60, "OSH-08: দুর্ঘটনা বা Near Miss ঘটলে কারণ অনুসন্ধান ও Corrective Action গ্রহণ করা হয় কি?", "ILO C155", "Cluster 5 · Occupational Safety and Health"],
    [61, "OSH-09: ভবনের কাঠামোগত নিরাপত্তা ও স্থাপনার উপযুক্ততা নিশ্চিত করা হয় কি?", "ILO C155; প্রযোজ্য জাতীয় আইন", "Cluster 5 · Occupational Safety and Health"],
    [62, "OSH-10: অনুমোদিত ভবন নকশা ও ব্যবহার অনুযায়ী কারখানার কার্যক্রম পরিচালিত হয় কি?", "BLA; প্রযোজ্য বিল্ডিং বিধিমালা", "Cluster 5 · Occupational Safety and Health"],
    [63, "OSH-11: বৈদ্যুতিক সংযোগ, DB, সার্কিট ব্রেকার ও বৈদ্যুতিক সরঞ্জাম নিরাপদ অবস্থায় রয়েছে কি?", "ILO C155; প্রযোজ্য বৈদ্যুতিক বিধিমালা", "Cluster 5 · Occupational Safety and Health"],
    [64, "OSH-12: মেশিনে প্রয়োজনীয় Safety Guard ও Safety Device স্থাপন করা হয়েছে কি?", "ILO C119; BLA", "Cluster 5 · Occupational Safety and Health"],
    [65, "OSH-13: মেশিন অপারেটরদের প্রয়োজনীয় নিরাপত্তা প্রশিক্ষণ দেওয়া হয় কি?", "ILO C155", "Cluster 5 · Occupational Safety and Health"],
    [66, "OSH-14: প্রয়োজনীয় কাজে কর্মীদের উপযুক্ত Personal Protective Equipment (PPE) সরবরাহ করা হয় কি?", "ILO C155; BLA", "Cluster 5 · Occupational Safety and Health"],
    [67, "OSH-15: PPE ব্যবহারের কার্যকারিতা নিয়মিত পর্যবেক্ষণ করা হয় কি?", "ILO C155", "Cluster 5 · Occupational Safety and Health"],
    [68, "OSH-16: রাসায়নিক পদার্থ সঠিকভাবে লেবেলিং, সংরক্ষণ ও ব্যবহার করা হয় কি?", "ILO C170; C155", "Cluster 5 · Occupational Safety and Health"],
    [69, "OSH-17: ব্যবহৃত রাসায়নিকের Safety Data Sheet (SDS) সহজে পাওয়া যায় কি?", "ILO C170", "Cluster 5 · Occupational Safety and Health"],
    [70, "OSH-18: রাসায়নিক ব্যবহারের স্থানে প্রয়োজনীয় ventilation ও spill-control ব্যবস্থা রয়েছে কি?", "ILO C170", "Cluster 5 · Occupational Safety and Health"],
    [71, "OSH-19: রাসায়নিক ব্যবহারের সময় প্রয়োজনীয় PPE ও প্রশিক্ষণ নিশ্চিত করা হয় কি?", "ILO C170; C155", "Cluster 5 · Occupational Safety and Health"],
    [72, "OSH-20: কর্মক্ষেত্রে পর্যাপ্ত আলো, বায়ু চলাচল ও তাপমাত্রা নিয়ন্ত্রণ নিশ্চিত করা হয় কি?", "ILO C155; BLA", "Cluster 5 · Occupational Safety and Health"],
    [73, "OSH-21: অতিরিক্ত শব্দ, ধুলাবালি, তাপ ও অন্যান্য কর্মপরিবেশগত ঝুঁকি মূল্যায়ন করা হয় কি?", "ILO C155", "Cluster 5 · Occupational Safety and Health"],
    [74, "OSH-22: কর্মীদের জন্য নিরাপদ পানীয় জলের ব্যবস্থা রয়েছে কি?", "ILO C155; BLA", "Cluster 5 · Occupational Safety and Health"],
    [75, "OSH-23: পর্যাপ্ত ও স্বাস্থ্যসম্মত টয়লেট, হাত ধোয়ার ব্যবস্থা এবং স্যানিটেশন সুবিধা রয়েছে কি?", "ILO C155; BLA", "Cluster 5 · Occupational Safety and Health"],
    [76, "OSH-24: নারী ও পুরুষ কর্মীদের জন্য প্রয়োজন অনুযায়ী পৃথক ও নিরাপদ টয়লেট সুবিধা রয়েছে কি?", "ILO C155; BLA", "Cluster 5 · Occupational Safety and Health"],
    [77, "OSH-25: পর্যাপ্ত First Aid Box, প্রশিক্ষিত First Aider এবং প্রয়োজনীয় চিকিৎসা সহায়তা রয়েছে কি?", "ILO C161; BLA", "Cluster 5 · Occupational Safety and Health"],
    [78, "OSH-26: কারখানায় প্রয়োজন অনুযায়ী চিকিৎসাকেন্দ্র, চিকিৎসক বা মেডিকেল সাপোর্টের ব্যবস্থা রয়েছে কি?", "ILO C161; BLA", "Cluster 5 · Occupational Safety and Health"],
    [79, "OSH-27: অগ্নিনির্বাপণ যন্ত্র, Fire Hydrant, Alarm ও Detection System কার্যকর অবস্থায় রয়েছে কি?", "ILO C155; BLA; প্রযোজ্য অগ্নিনিরাপত্তা বিধি", "Cluster 5 · Occupational Safety and Health"],
    [80, "OSH-28: পর্যাপ্ত জরুরি নির্গমন পথ ও Exit Door রয়েছে এবং সেগুলো বাধামুক্ত রাখা হয় কি?", "ILO C155; BLA", "Cluster 5 · Occupational Safety and Health"],
    [81, "OSH-29: জরুরি বহির্গমন চিহ্ন, Emergency Lighting ও Evacuation Plan প্রদর্শিত রয়েছে কি?", "ILO C155", "Cluster 5 · Occupational Safety and Health"],
    [82, "OSH-30: নিয়মিত Fire Drill ও Emergency Evacuation Drill পরিচালনা করা হয় কি?", "ILO C155; BLA", "Cluster 5 · Occupational Safety and Health"],
    [83, "OSH-31: জরুরি পরিস্থিতি মোকাবিলার জন্য দায়িত্বপ্রাপ্ত Emergency Response Team রয়েছে কি?", "ILO C155", "Cluster 5 · Occupational Safety and Health"],
    [84, "OSH-32: Boiler, Generator, Lift, Compressor ও অন্যান্য বিশেষ সরঞ্জাম আইন অনুযায়ী পরিচালনা ও রক্ষণাবেক্ষণ করা হয় কি?", "প্রযোজ্য জাতীয় আইন; ILO C155", "Cluster 5 · Occupational Safety and Health"],
    [85, "OSH-33: কর্মীদের বসার জায়গা, কাজের টেবিল, চলাচলের রাস্তা ও কর্মক্ষেত্রের Ergonomic ব্যবস্থা উপযুক্ত কি?", "ILO C155", "Cluster 5 · Occupational Safety and Health"],
    [86, "OSH-34: গর্ভবতী ও স্তন্যদানকারী কর্মীদের জন্য প্রয়োজনীয় স্বাস্থ্য ও নিরাপত্তা সুরক্ষা রয়েছে কি?", "ILO C183; C155; BLA", "Cluster 5 · Occupational Safety and Health"],
    [87, "OSH-35: শ্রমিকদের আবাসন সুবিধা থাকলে তা নিরাপদ, স্বাস্থ্যসম্মত ও উপযুক্ত কি?", "ILO C155; প্রযোজ্য মানদণ্ড", "Cluster 5 · Occupational Safety and Health"],
    [88, "OSH-36: কর্মীদের স্বাস্থ্য পরীক্ষা, পেশাগত স্বাস্থ্যঝুঁকি পর্যবেক্ষণ এবং প্রয়োজনীয় Follow-up করা হয় কি?", "ILO C161; C155", "Cluster 5 · Occupational Safety and Health"],
    [89, "CO-01: প্রত্যেক কর্মীকে প্রযোজ্য গ্রেড ও আইন অনুযায়ী ন্যূনতম মজুরি প্রদান করা হয় কি?", "ILO C131; C95; BLA", "Cluster 6 · Compensation"],
    [90, "CO-02: কর্মীর পদ, গ্রেড, নিয়োগের তারিখ ও মজুরি কাঠামো সঠিকভাবে নির্ধারণ করা হয়েছে কি?", "BLA; প্রযোজ্য Wage Gazette", "Cluster 6 · Compensation"],
    [91, "CO-03: Basic, House Rent, Medical, Conveyance ও অন্যান্য প্রযোজ্য ভাতা সঠিকভাবে গণনা করা হয় কি?", "BLA; Wage Gazette", "Cluster 6 · Compensation"],
    [92, "CO-04: শিক্ষানবিশ, প্রবেশন ও স্থায়ী কর্মীদের মজুরি আইন অনুযায়ী নির্ধারণ করা হয় কি?", "BLA; Wage Gazette", "Cluster 6 · Compensation"],
    [93, "CO-05: ওভারটাইমের পারিশ্রমিক আইন অনুযায়ী নির্ধারিত হারে গণনা করা হয় কি?", "ILO C1; BLA", "Cluster 6 · Compensation"],
    [94, "CO-06: ওভারটাইমের হিসাব প্রকৃত কর্মঘণ্টা ও প্রযোজ্য মজুরি কাঠামোর ভিত্তিতে করা হয় কি?", "BLA", "Cluster 6 · Compensation"],
    [95, "CO-07: ছুটির দিন, সাপ্তাহিক বিশ্রাম ও অন্যান্য প্রযোজ্য ক্ষেত্রে Premium Pay সঠিকভাবে দেওয়া হয় কি?", "BLA", "Cluster 6 · Compensation"],
    [96, "CO-08: রাতের শিফট বা বিশেষ কাজের জন্য প্রযোজ্য অতিরিক্ত সুবিধা দেওয়া হয় কি?", "BLA; চাকরির শর্ত", "Cluster 6 · Compensation"],
    [97, "CO-09: মজুরি নির্ধারিত সময়ের মধ্যে প্রদান করা হয় কি?", "ILO C95; BLA", "Cluster 6 · Compensation"],
    [98, "CO-10: মজুরি ব্যাংক বা অনুমোদিত পদ্ধতিতে কর্মীর কাছে সরাসরি প্রদান করা হয় কি?", "ILO C95; BLA", "Cluster 6 · Compensation"],
    [99, "CO-11: প্রত্যেক কর্মীকে বিস্তারিত Payslip প্রদান করা হয় কি?", "ILO C95; BLA", "Cluster 6 · Compensation"],
    [100, "CO-12: Payslip-এ Basic, Allowance, OT, Deduction, Gross ও Net Pay সঠিকভাবে প্রদর্শিত হয় কি?", "ILO C95; BLA", "Cluster 6 · Compensation"],
    [101, "CO-13: মজুরি থেকে কর্তন শুধুমাত্র আইনসম্মত কারণে এবং অনুমোদিত পদ্ধতিতে করা হয় কি?", "ILO C95; BLA", "Cluster 6 · Compensation"],
    [102, "CO-14: অনুপস্থিতি, বিলম্ব বা অন্যান্য কর্তনের হিসাব আইন অনুযায়ী করা হয় কি?", "BLA", "Cluster 6 · Compensation"],
    [103, "CO-15: কর্মীদের অর্জিত ছুটির আর্থিক সুবিধা আইন অনুযায়ী প্রদান করা হয় কি?", "BLA", "Cluster 6 · Compensation"],
    [104, "CO-16: মাতৃত্বকালীন সুবিধা আইন অনুযায়ী হিসাব ও প্রদান করা হয় কি?", "BLA; ILO C183", "Cluster 6 · Compensation"],
    [105, "CO-17: চাকরি অবসান, পদত্যাগ বা বরখাস্তের ক্ষেত্রে প্রাপ্য চূড়ান্ত পাওনা সঠিকভাবে হিসাব করা হয় কি?", "BLA; ILO C158", "Cluster 6 · Compensation"],
    [106, "CO-18: কর্মীদের প্রযোজ্য উৎসব বোনাস ও অন্যান্য সুবিধা প্রদান করা হয় কি?", "BLA; প্রযোজ্য Wage Gazette", "Cluster 6 · Compensation"],
    [107, "CO-19: গ্র্যাচুইটি, ভবিষ্য তহবিল বা অন্যান্য Social Security সুবিধা প্রযোজ্য হলে সঠিকভাবে প্রদান করা হয় কি?", "BLA; ILO C102", "Cluster 6 · Compensation"],
    [108, "CO-20: মজুরি, ব্যাংক পেমেন্ট, হাজিরা ও Payroll Register-এর তথ্যের মধ্যে সামঞ্জস্য রয়েছে কি?", "ILO C95; BLA", "Cluster 6 · Compensation"],
    [109, "CO-21: Piece-rate বা উৎপাদনভিত্তিক মজুরি থাকলে আইন অনুযায়ী ন্যূনতম প্রাপ্যতা নিশ্চিত করা হয় কি?", "ILO C95; BLA", "Cluster 6 · Compensation"],
    [110, "CHR-01: প্রত্যেক কর্মীকে আইন অনুযায়ী নিয়োগপত্র প্রদান করা হয় কি?", "BLA", "Cluster 7 · Contracts and Human Resources"],
    [111, "CHR-02: কর্মীদের পরিচয়পত্র প্রদান ও সংরক্ষণ নিশ্চিত করা হয় কি?", "BLA", "Cluster 7 · Contracts and Human Resources"],
    [112, "CHR-03: নিয়োগপত্রে পদ, গ্রেড, মজুরি, কর্মস্থল ও চাকরির শর্ত উল্লেখ থাকে কি?", "BLA", "Cluster 7 · Contracts and Human Resources"],
    [113, "CHR-04: কর্মীদের নিয়োগের ধরন ও চাকরির শ্রেণিবিন্যাস আইন অনুযায়ী নির্ধারণ করা হয় কি?", "BLA", "Cluster 7 · Contracts and Human Resources"],
    [114, "CHR-05: নিয়োগের সময় কর্মীদের চাকরির শর্ত ও অধিকার সম্পর্কে অবহিত করা হয় কি?", "BLA", "Cluster 7 · Contracts and Human Resources"],
    [115, "CHR-06: Probation, Confirmation ও চাকরির স্থায়ীকরণ প্রক্রিয়া আইন অনুযায়ী পরিচালিত হয় কি?", "BLA", "Cluster 7 · Contracts and Human Resources"],
    [116, "CHR-07: কর্মীদের ব্যক্তিগত ফাইল ও HR Records হালনাগাদ রাখা হয় কি?", "BLA", "Cluster 7 · Contracts and Human Resources"],
    [117, "CHR-08: Attendance, Leave, Appointment, Promotion ও Transfer Records সংরক্ষণ করা হয় কি?", "BLA", "Cluster 7 · Contracts and Human Resources"],
    [118, "CHR-09: নিয়োগ ও পদোন্নতির ক্ষেত্রে স্বচ্ছ এবং বৈষম্যহীন পদ্ধতি অনুসরণ করা হয় কি?", "ILO C111; BLA", "Cluster 7 · Contracts and Human Resources"],
    [119, "CHR-10: কর্মীদের দায়িত্ব ও কর্তব্য সম্পর্কে Job Description প্রদান করা হয় কি?", "ভালো HR ব্যবস্থাপনা অনুশীলন", "Cluster 7 · Contracts and Human Resources"],
    [120, "CHR-11: কর্মীদের অভিযোগ গ্রহণ ও নিষ্পত্তির কার্যকর Grievance Mechanism রয়েছে কি?", "BLA; ILO C135", "Cluster 7 · Contracts and Human Resources"],
    [121, "CHR-12: অভিযোগ তদন্তের সময় সংশ্লিষ্ট পক্ষের বক্তব্য গ্রহণ করা হয় কি?", "BLA", "Cluster 7 · Contracts and Human Resources"],
    [122, "CHR-13: শৃঙ্খলামূলক ব্যবস্থা গ্রহণের ক্ষেত্রে আইনসম্মত তদন্ত ও আত্মপক্ষ সমর্থনের সুযোগ দেওয়া হয় কি?", "BLA", "Cluster 7 · Contracts and Human Resources"],
    [123, "CHR-14: শাস্তিমূলক ব্যবস্থা বা চাকরি অবসানের ক্ষেত্রে লিখিত নোটিশ ও প্রয়োজনীয় প্রক্রিয়া অনুসরণ করা হয় কি?", "BLA; ILO C158", "Cluster 7 · Contracts and Human Resources"],
    [124, "CHR-15: পদত্যাগ, অব্যাহতি, ছাঁটাই ও বরখাস্তের ক্ষেত্রে প্রযোজ্য আইন অনুসরণ করা হয় কি?", "BLA; ILO C158", "Cluster 7 · Contracts and Human Resources"],
    [125, "CHR-16: কর্মীদের চূড়ান্ত পাওনা ও প্রয়োজনীয় চাকরিসংক্রান্ত নথি আইন অনুযায়ী প্রদান করা হয় কি?", "BLA", "Cluster 7 · Contracts and Human Resources"],
    [126, "CHR-17: Contractor, Outsourced Worker ও Subcontractor ব্যবস্থাপনায় আইনগত দায়িত্ব ও শ্রমিক অধিকার নিশ্চিত করা হয় কি?", "BLA; ILO C181 (প্রযোজ্য ক্ষেত্রে)", "Cluster 7 · Contracts and Human Resources"],
    [127, "CHR-18: কর্মীদের নিয়োগ ও HR-সংক্রান্ত নীতিমালা নিয়মিত পর্যালোচনা ও হালনাগাদ করা হয় কি?", "ভালো HR ব্যবস্থাপনা অনুশীলন", "Cluster 7 · Contracts and Human Resources"],
    [128, "CHR-19: কর্মীদের নীতিমালা, অভিযোগ পদ্ধতি ও চাকরিসংক্রান্ত নিয়ম সম্পর্কে প্রশিক্ষণ দেওয়া হয় কি?", "ILO C155; ভালো HR অনুশীলন", "Cluster 7 · Contracts and Human Resources"],
    [129, "CHR-20: শ্রমিক প্রতিনিধি ও ব্যবস্থাপনার মধ্যে নিয়মিত আলোচনা ও যোগাযোগের ব্যবস্থা রয়েছে কি?", "ILO C98; C135", "Cluster 7 · Contracts and Human Resources"],
    [130, "WT-01: দৈনিক নিয়মিত কর্মঘণ্টা প্রযোজ্য আইন অনুযায়ী নির্ধারিত কি?", "ILO C1; BLA", "Cluster 8 · Working Time"],
    [131, "WT-02: সাপ্তাহিক নিয়মিত কর্মঘণ্টা আইন অনুযায়ী সীমাবদ্ধ রাখা হয় কি?", "ILO C1; BLA", "Cluster 8 · Working Time"],
    [132, "WT-03: দৈনিক ও সাপ্তাহিক কর্মঘণ্টার প্রকৃত হিসাব সংরক্ষণ করা হয় কি?", "BLA", "Cluster 8 · Working Time"],
    [133, "WT-04: হাজিরা, গেট রেকর্ড, উৎপাদন রেকর্ড ও Payroll-এর কর্মঘণ্টার মধ্যে সামঞ্জস্য রয়েছে কি?", "BLA", "Cluster 8 · Working Time"],
    [134, "WT-05: কর্মীদের ওভারটাইমে কাজ করানোর ক্ষেত্রে আইনসম্মত সম্মতি ও প্রক্রিয়া অনুসরণ করা হয় কি?", "ILO C29; BLA", "Cluster 8 · Working Time"],
    [135, "WT-06: দৈনিক ও সাপ্তাহিক ওভারটাইম আইনসম্মত সীমার মধ্যে রাখা হয় কি?", "BLA", "Cluster 8 · Working Time"],
    [136, "WT-07: ওভারটাইমের প্রকৃত সময় সঠিকভাবে রেকর্ড করা হয় কি?", "BLA", "Cluster 8 · Working Time"],
    [137, "WT-08: ওভারটাইমের ক্ষেত্রে কোনো জাল হাজিরা বা দ্বৈত রেকর্ড রাখা হয় কি?", "BLA", "Cluster 8 · Working Time"],
    [138, "WT-09: কর্মীদের সাপ্তাহিক ছুটি ও বিশ্রামের সুযোগ দেওয়া হয় কি?", "ILO C14; BLA", "Cluster 8 · Working Time"],
    [139, "WT-10: আইন অনুযায়ী প্রয়োজনীয় বিরতি ও খাবারের সময় প্রদান করা হয় কি?", "BLA", "Cluster 8 · Working Time"],
    [140, "WT-11: বার্ষিক ছুটি আইন অনুযায়ী প্রদান করা হয় কি?", "BLA", "Cluster 8 · Working Time"],
    [141, "WT-12: নৈমিত্তিক ছুটি ও অসুস্থতাজনিত ছুটি আইন অনুযায়ী প্রদান করা হয় কি?", "BLA", "Cluster 8 · Working Time"],
    [142, "WT-13: উৎসব ছুটি ও অন্যান্য প্রযোজ্য ছুটি প্রদান করা হয় কি?", "BLA", "Cluster 8 · Working Time"],
    [143, "WT-14: মাতৃত্বকালীন ছুটি ও সুবিধা আইন অনুযায়ী প্রদান করা হয় কি?", "BLA; ILO C183", "Cluster 8 · Working Time"],
    [144, "WT-15: স্তন্যদানকারী মায়েদের জন্য আইন অনুযায়ী প্রয়োজনীয় বিরতির সুযোগ দেওয়া হয় কি?", "BLA; ILO C183", "Cluster 8 · Working Time"],
    [145, "WT-16: ছুটির রেকর্ড, অনুমোদন ও ব্যালেন্স সঠিকভাবে সংরক্ষণ করা হয় কি?", "BLA", "Cluster 8 · Working Time"],
    [146, "WT-17: ছুটির দিনে কাজ করালে আইন অনুযায়ী প্রাপ্য বিশ্রাম ও আর্থিক সুবিধা প্রদান করা হয় কি?", "BLA", "Cluster 8 · Working Time"],
    [147, "WT-18: কর্মীদের প্রকৃত কর্মঘণ্টা গোপন বা পরিবর্তন করে দেখানোর কোনো অনুশীলন রয়েছে কি?", "BLA; Better Work CAT", "Cluster 8 · Working Time"],
    [148, "LR-01: কারখানায় কর্মীদের প্রশিক্ষণের প্রয়োজন (Training Needs Assessment – TNA) নির্ধারণ করা হয় কি?", "Better Work Learning", "Additional · Learning"],
    [149, "LR-02: কর্মীদের প্রয়োজন অনুযায়ী নিয়মিত প্রশিক্ষণ পরিকল্পনা ও বাস্তবায়ন করা হয় কি?", "Better Work Learning", "Additional · Learning"],
    [150, "LR-03: প্রশিক্ষণ পরিকল্পনা তৈরির সময় নির্বাচিত শ্রমিক প্রতিনিধি ও ট্রেড ইউনিয়নের সঙ্গে পরামর্শ করা হয় কি?", "Better Work Learning", "Additional · Learning"],
    [151, "LR-04: নতুন কর্মীদের Orientation ও Workplace Rules সম্পর্কে প্রশিক্ষণ দেওয়া হয় কি?", "ILO C155; Better Work Learning", "Additional · Learning"],
    [152, "LR-05: সুপারভাইজার ও ম্যানেজমেন্টকে Labour Law, Worker Rights ও Workplace Management বিষয়ে প্রশিক্ষণ দেওয়া হয় কি?", "Better Work Learning", "Additional · Learning"],
    [153, "LR-06: Fire Safety, OSH, First Aid ও Emergency Response বিষয়ে প্রয়োজনীয় প্রশিক্ষণ দেওয়া হয় কি?", "ILO C155; C187", "Additional · Learning"],
    [154, "LR-07: প্রশিক্ষণের উপস্থিতি, বিষয়বস্তু, প্রশিক্ষক ও মূল্যায়নের রেকর্ড সংরক্ষণ করা হয় কি?", "Better Work Learning", "Additional · Learning"],
    [155, "LR-08: প্রশিক্ষণের কার্যকারিতা মূল্যায়ন এবং প্রয়োজন অনুযায়ী পুনঃপ্রশিক্ষণের ব্যবস্থা রয়েছে কি?", "Better Work Learning", "Additional · Learning"],
    [156, "PI-01: Better Work Assessment চলাকালে মূল্যায়নকারীকে কারখানার প্রয়োজনীয় বিভাগ ও কর্মস্থলে প্রবেশের সুযোগ দেওয়া হয় কি?", "Better Work CAT – Process Integrity", "Additional · Process Integrity"],
    [157, "PI-02: চাহিদা অনুযায়ী প্রয়োজনীয় নথি ও রেকর্ড সময়মতো সরবরাহ করা হয় কি?", "Better Work CAT – Process Integrity", "Additional · Process Integrity"],
    [158, "PI-03: মূল্যায়নের সময় ব্যবস্থাপনা সঠিক ও প্রকৃত তথ্য প্রদান করে কি?", "Better Work CAT – Process Integrity", "Additional · Process Integrity"],
    [159, "PI-04: শ্রমিকদের সঙ্গে স্বাধীন ও গোপনীয় সাক্ষাৎকার গ্রহণে কোনো বাধা সৃষ্টি করা হয় কি?", "Better Work CAT – Process Integrity", "Additional · Process Integrity"],
    [160, "PI-05: কর্মীদের সাক্ষাৎকারের আগে উত্তর শিখিয়ে দেওয়া, প্রভাবিত করা বা ভয়ভীতি প্রদর্শন করা হয় কি?", "Better Work CAT – Process Integrity", "Additional · Process Integrity"],
    [161, "PI-06: মূল্যায়নের সময় প্রকৃত Payroll, Attendance, OT ও অন্যান্য রেকর্ড উপস্থাপন করা হয় কি?", "Better Work CAT – Process Integrity", "Additional · Process Integrity"],
    [162, "PI-07: মূল্যায়নের জন্য নথি পরিবর্তন, জালিয়াতি বা তথ্য গোপন করার কোনো ঘটনা রয়েছে কি?", "Better Work CAT – Process Integrity", "Additional · Process Integrity"],
    [163, "PI-08: পূর্ববর্তী মূল্যায়নের CAP ও Corrective Action-এর বাস্তব অগ্রগতি সঠিকভাবে উপস্থাপন করা হয় কি?", "Better Work CAT – Process Integrity", "Additional · Process Integrity"],
    [164, "PI-09: মূল্যায়নকারী, ব্যবস্থাপনা ও শ্রমিক প্রতিনিধিদের সঙ্গে সহযোগিতামূলক ও স্বচ্ছ আচরণ করা হয় কি?", "Better Work CAT – Process Integrity", "Additional · Process Integrity"],
    [165, "PI-10: মূল্যায়ন চলাকালে পাওয়া গুরুত্বপূর্ণ সমস্যা, সীমাবদ্ধতা ও অন্যান্য বিষয় যথাযথভাবে প্রকাশ করা হয় কি?", "Better Work CAT – Process Integrity", "Additional · Process Integrity"],
  ] },
];

export const AREA_CODES = CHECKLIST_AREAS.map(a => a.code);
/** Stored value of an Auditing Area, e.g. "A. Legal compliance, management and worker rights". */
export const areaLabel = (a: { code: string; name: string }) => `${a.code}. ${a.name}`;
export const AUDIT_AREAS = CHECKLIST_AREAS.map(a => ({ code: a.code, name: a.name, label: areaLabel(a), count: a.points.length }));
/** Letter (A–E) of a stored Auditing Area value ('' if it is not one of the four). */
export const areaCodeOf = (value: string) => /^([A-E])\. /.exec(value)?.[1] ?? '';

export const CHECKLIST_POINTS: ChecklistPoint[] = CHECKLIST_AREAS.flatMap(a =>
  a.points.map(([sl, point, principle, group]) => ({ sl, point, principle, area: a.code, group })));

/** Stored NC Ref text: "<Code of Conduct Point> — <Principle No. of Standard>". */
export const ncRefText = (p: ChecklistPoint) => `${p.point} \u2014 ${p.principle}`;
const POINT_BY_REF = new Map(CHECKLIST_POINTS.map(p => [ncRefText(p), p]));
export const findPointByRef = (ncRef: string) => POINT_BY_REF.get(ncRef);

// Compatibility exports (grouped list used by older code): one group per area.
export const AREA_GROUPS: { standard: string; items: string[] }[] =
  CHECKLIST_AREAS.map(a => ({ standard: areaLabel(a), items: a.points.map(p => p[1]) }));
export const areaValue = (standard: string, item: string) => (standard ? `${standard}: ${item}` : item);
export const ALL_AREA_VALUES: string[] = AUDIT_AREAS.map(a => a.label);

// ─── Items ───────────────────────────────────────────────────────────────────

export interface AuditorItem { slNo: number; name: string; designation: string; organization: string; }
export const blankAuditorItem = (slNo: number): AuditorItem => ({ slNo, name: '', designation: '', organization: '' });

export interface CorrectiveActionItem {
  slNo: number;
  ncId: string;
  ncRef: string;
  detailsOfNonCompliance: string;
  nonCompliancePictureLink: string;
  preventiveCorrectiveActions: string;
  timeline: string;
  agreedByManagement: string;
  responsiblePersonName: string;
}
export const blankCorrectiveActionItem = (slNo: number): CorrectiveActionItem => ({
  slNo, ncId: `NC-${String(slNo).padStart(3, '0')}`, ncRef: '', detailsOfNonCompliance: '', nonCompliancePictureLink: '',
  preventiveCorrectiveActions: '', timeline: '', agreedByManagement: '', responsiblePersonName: '',
});


// ─── Timeline ────────────────────────────────────────────────────────────────
// The form stores a plain DATE (yyyy-mm-dd). The report shows both: "dd-mm-yyyy | N days",
// where N = days from the audit date (submission date when no audit date is set).

const CRITICAL_POINTS = new Set([8, 9, 10, 11, 12, 13, 16, 36, 37, 38, 46]); // child/forced labour, abuse, fire, structure, electrical, evacuation
const AREA_DAYS: Record<string, number> = { A: 60, B: 30, C: 90, D: 45, E: 45 };
/** Suggested correction period (days) for a checklist point: critical points 15, otherwise by area. */
export const suggestedDays = (p: ChecklistPoint): number => (CRITICAL_POINTS.has(p.sl) && (p.area === 'A' || p.area === 'B') ? 15 : AREA_DAYS[p.area] ?? 30);

const isoParts = (iso: string) => /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
const toIsoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
/** ISO date + n days → ISO date ('' if the input is not valid). */
export function addDaysIso(iso: string, n: number): string {
  const m = isoParts(iso);
  return m && Number.isFinite(n) ? toIsoDate(new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + n)) : '';
}
/** Whole days from one ISO date to another (null if either is invalid). */
export function daysBetween(fromIso: string, toIso: string): number | null {
  const a = isoParts(fromIso), b = isoParts(toIso);
  if (!a || !b) return null;
  return Math.round((Date.UTC(+b[1], +b[2] - 1, +b[3]) - Date.UTC(+a[1], +a[2] - 1, +a[3])) / 86400000);
}
/** Stored timeline → ISO date. Also reads older values: "dd-mm-yyyy" and "30 days" (needs a base date). */
export function timelineIso(t: string, baseIso: string): string {
  const s = (t ?? '').trim();
  if (isoParts(s)) return s.slice(0, 10);
  const d = /^(\d{2})-(\d{2})-(\d{4})$/.exec(s);
  if (d) return `${d[3]}-${d[2]}-${d[1]}`;
  const n = /^(\d+)\s*days?$/i.exec(s);
  return n && baseIso ? addDaysIso(baseIso, Number(n[1])) : '';
}
/** Report text: "dd-mm-yyyy | N days" (free text from old records is shown as it was typed). */
export function timelineDisplay(t: string, auditIso: string, submissionIso: string): string {
  const base = auditIso || submissionIso;
  const iso = timelineIso(t, base);
  if (!iso) return (t ?? '').trim();
  const days = daysBetween(base, iso);
  return days === null ? formatDMY(iso) : `${formatDMY(iso)} | ${days} days`;
}

/**
 * NC ID = <Area A–D>-<SL of the Code of Conduct point>-<running no. for that point>,
 * e.g. the 1st NC on point 5 (Freedom of Association) → "A-5-1", the 2nd → "A-5-2".
 * An NC whose NC Ref is not (yet) a checklist point keeps its current NC ID.
 */
export function assignNcIds(items: CorrectiveActionItem[]): CorrectiveActionItem[] {
  const seen: Record<string, number> = {};
  return items.map(c => {
    const p = findPointByRef(c.ncRef);
    if (!p) return c;
    const key = `${p.area}-${p.sl}`;
    seen[key] = (seen[key] ?? 0) + 1;
    const ncId = `${key}-${seen[key]}`;
    return ncId === c.ncId ? c : { ...c, ncId };
  });
}

export interface ComplianceAuditData {
  auditType: AuditCategory;
  companyName: string;
  siteName: string;
  siteAddress: string;
  siteContactName: string;
  siteContactJobTitle: string;
  sitePhone: string;
  siteEmail: string;
  auditRound: AuditRound;
  auditingAreas: string[];
  auditDate: string;
  auditors: AuditorItem[];
  correctiveActions: CorrectiveActionItem[];
  remarks: string;
  date: string;
  factoryName: string;
  factoryAddress: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function formatDMY(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  return m ? `${m[3]}-${m[2]}-${m[1]}` : (iso ?? '');
}

export function blankComplianceAudit(): ComplianceAuditData {
  return {
    auditType: 'Internal', companyName: '', siteName: '', siteAddress: '',
    siteContactName: '', siteContactJobTitle: '', sitePhone: '', siteEmail: '',
    auditRound: 'Initial', auditingAreas: [], auditDate: '',
    auditors: [blankAuditorItem(1)], correctiveActions: [blankCorrectiveActionItem(1)],
    remarks: '', date: todayIso(), factoryName: '', factoryAddress: '',
  };
}
export const INITIAL_COMPLIANCE_AUDIT_STATE: ComplianceAuditData = blankComplianceAudit();

export function resizeAuditors(current: AuditorItem[], target: number): AuditorItem[] {
  return Array.from({ length: Math.max(1, target) }, (_, i) => (current[i] ? { ...current[i], slNo: i + 1 } : blankAuditorItem(i + 1)));
}
export function resizeCorrectiveActions(current: CorrectiveActionItem[], target: number): CorrectiveActionItem[] {
  return assignNcIds(Array.from({ length: Math.max(1, target) }, (_, i) => (current[i] ? { ...current[i], slNo: i + 1 } : blankCorrectiveActionItem(i + 1))));
}

function parseArray(raw: unknown): Record<string, unknown>[] {
  try { const a = JSON.parse(String(raw ?? '[]')); return Array.isArray(a) ? a : []; } catch { return []; }
}
export function parseNcItems(raw: unknown): CorrectiveActionItem[] {
  return parseArray(raw).map((c, i) => ({
    slNo: Number(c.slNo ?? i + 1),
    ncId: String(c.ncId ?? c.nonComplianceNumber ?? ''),
    ncRef: String(c.ncRef ?? ''),
    detailsOfNonCompliance: String(c.detailsOfNonCompliance ?? ''),
    nonCompliancePictureLink: String(c.nonCompliancePictureLink ?? ''),
    preventiveCorrectiveActions: String(c.preventiveCorrectiveActions ?? ''),
    timeline: String(c.timeline ?? ''),
    agreedByManagement: String(c.agreedByManagement ?? ''),
    responsiblePersonName: String(c.responsiblePersonName ?? ''),
  }));
}
export function parseAuditors(raw: unknown): AuditorItem[] {
  return parseArray(raw).map((a, i) => ({
    slNo: Number(a.slNo ?? i + 1), name: String(a.name ?? ''), designation: String(a.designation ?? ''), organization: String(a.organization ?? ''),
  }));
}
export function parseAreas(raw: unknown): string[] {
  try { const a = JSON.parse(String(raw ?? '[]')); return Array.isArray(a) ? a.map(String) : []; } catch { return []; }
}

// ─── Entries + shared filters ────────────────────────────────────────────────

export interface AuditEntry { rec: DbRecord; ncCount: number; }
export const buildAuditEntries = (records: DbRecord[]): AuditEntry[] =>
  records.map(rec => ({ rec, ncCount: parseNcItems(rec.correctiveActionsJson).length }));

export type AuditSortField = 'auditDate' | 'siteName' | '';

export interface AuditFilters {
  search: string;
  types: string[];
  round: string;
  dateFrom: string;
  dateTo: string;
  columns: Record<string, string[]>;
  sort: { field: AuditSortField; dir: 'asc' | 'desc' };
}
export const EMPTY_AUDIT_FILTERS: AuditFilters = {
  search: '', types: [], round: '', dateFrom: '', dateTo: '', columns: {}, sort: { field: '', dir: 'asc' },
};
export function countActiveAuditFilters(f: AuditFilters): number {
  const cols = Object.values(f.columns ?? {}).filter(a => a.length > 0).length;
  return [f.search.trim(), f.types.length > 0, f.round, f.dateFrom, f.dateTo].filter(Boolean).length + cols;
}
export const hasActiveAuditFilters = (f: AuditFilters) => countActiveAuditFilters(f) > 0;

export const BLANK_VALUE = '(Blank)';
export function auditColumnValue(rec: DbRecord, field: string): string {
  const raw = String((rec as unknown as Record<string, unknown>)[field] ?? '').trim();
  return (field === 'auditDate' ? raw.slice(0, 10) : raw) || BLANK_VALUE;
}

export function filterAuditEntries(entries: AuditEntry[], f: AuditFilters): AuditEntry[] {
  const words = f.search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const result = entries.filter(({ rec }) => {
    const d = String(rec.auditDate ?? '').slice(0, 10);
    if (f.dateFrom && (!d || d < f.dateFrom)) return false;
    if (f.dateTo && (!d || d > f.dateTo)) return false;
    if (f.types.length && !f.types.includes(String(rec.auditType ?? ''))) return false;
    if (f.round && String(rec.auditRound ?? '') !== f.round) return false;
    for (const [field, sel] of Object.entries(f.columns ?? {})) {
      if (sel.length && !sel.includes(auditColumnValue(rec, field))) return false;
    }
    if (words.length) {
      const nc = parseNcItems(rec.correctiveActionsJson).map(c => `${c.ncId} ${c.ncRef} ${c.detailsOfNonCompliance}`).join(' ');
      const hay = [rec.siteName, rec.companyName, rec.siteContactName, nc, rec.auditingAreasJson].map(v => String(v ?? '').toLowerCase()).join(' ');
      if (!words.every(w => hay.includes(w))) return false;
    }
    return true;
  });
  const { field, dir } = f.sort ?? { field: '', dir: 'asc' };
  if (!field) return result;
  const mult = dir === 'asc' ? 1 : -1;
  const key = (e: AuditEntry) => (field === 'auditDate' ? String(e.rec.auditDate ?? '').slice(0, 10) : String(e.rec.siteName ?? '').trim());
  return [...result].sort((a, b) => {
    const ka = key(a), kb = key(b);
    if (!ka && !kb) return 0;
    if (!ka) return 1;
    if (!kb) return -1;
    return mult * ka.localeCompare(kb, undefined, { numeric: true, sensitivity: 'base' });
  });
}