// ═══════════════════════════════════════════════════════════════════════════════
// RMS V16.21 — Google Apps Script Backend
// ═══════════════════════════════════════════════════════════════════════════════
//
// CHANGES FROM V16.5 (cumulative, header previously went stale — corrected here):
//
//   V16.6/16.7 — maternity module redesigned: the 12 flat
//   installment1*/installment2* columns plus benefitInstallment/
//   activeInstallment were REMOVED ENTIRELY (per explicit confirmation
//   that existing maternity data didn't need to carry forward) and
//   replaced with a single installmentsJson column — same JSON-blob
//   pattern as requisitions.itemsJson/increments.employeesJson.
//
//   V16.8 — two new modules added (auditvisits, legaldocuments), first
//   built as array-of-items documents like Requisition.
//
//   V16.9 — auditvisits and legaldocuments REDESIGNED (per explicit
//   correction): each is now ONE FLAT RECORD per audit/visit or per
//   document — matching Left Employee Notice's save model — not an
//   array-of-items document. auditVisitsJson/legalDocumentsJson columns
//   REMOVED, replaced with individual flat columns (see schemas below).
//   Also added: miscbills — a NEW Requisition-style module (3 templates:
//   Holiday/Adjustment/Festival Holiday Bill, sharing one itemsJson
//   shape). New ID prefix: MSC- (miscellaneous bill).
//
//   V16.10 — auditvisits and legaldocuments field sets changed AGAIN to
//   match an explicit column spec (Document/Record ID uses the existing
//   'id' column — no new column needed; "Actions" is UI-only, not
//   stored). Field renames, NOT additive — any V16.9-shape record would
//   need manual migration (unlikely given how recently V16.9 shipped).
//   Also: miscbills' item shape changed inside itemsJson (cardId->cardNo,
//   deptSection->department, basicSalary removed — now computed
//   dynamically from grossSalary, not stored) — no Code.gs schema change
//   needed for this since it's all inside the existing itemsJson blob.
//
//   V16.11 — new module: livingwage (Living Wage / Anker Methodology
//   estimation support). One record = one benchmark entry OR full
//   calculator study. New ID prefix: LW- (living wage). Wage-gap
//   comparison itself is NOT stored — computed live at report time from
//   the existing employees sheet's grossSalary column, so no schema
//   change was needed there either. Also added: surveysJson/totalSurveys
//   columns (Physical Individual Survey feature — Anker Methodology's
//   local-participation component, records real worker interviews).
//   Reorganized into the formal 5-stage workflow "Living Wage Assessment
//   & Gap Management" (Survey & Assessment -> Living Wage Calculation ->
//   Wage Gap Analysis -> Management Review & Recommendations ->
//   Corrective Action & Commitment) — added managementReviewJson,
//   correctiveActionsJson, commitmentJson columns for the 2 new stages.
//
//   V16.12 — new module: suppliers (Supplier Assessment, Approval &
//   Tracking — BSCI/Sedex SMETA/WRAP compliance evaluation). One record
//   = one supplier, with an array of assessment entries inside
//   assessmentsJson (one per standard — a supplier can be assessed
//   against multiple standards). Approval decision (Pending/Approved/
//   Conditional/Rejected) is stored PER assessment, not as one overall
//   supplier status. New ID prefix: SUP- (supplier).
//
//   V16.13 — new module: disciplinaryactions (Disciplinary Action —
//   branching workflow: Show Cause Notice -> reply status -> if
//   unsatisfactory, investigation committee formation -> notice to start
//   investigation). committeeMembersJson holds a DYNAMICALLY-SIZED array
//   (row count driven by numberOfCommitteeMembers, not manually added).
//   New ID prefix: DA- (disciplinary action).
//
//   V16.14 — new module: candidates (Candidate Pipeline — Part B of
//   Recruitment & Onboarding; Part A, Manpower Requisition, was added as
//   a third type inside the existing requisitions module instead of a
//   separate module). One record = one candidate, tracked through a
//   single CURRENT stage (Applied through Joined/Rejected/Withdrawn),
//   not a full stage-transition history log. New ID prefix: CAN-
//   (candidate).
//
//   V16.15 — disciplinaryactions REBUILT AGAIN (per explicit correction
//   + 3 reference letter images): notice1Date renamed to
//   notice1IssueDate; added referenceNo (সূত্র নং), subject (বিষয়
//   dropdown), complaint (অভিযোগ), replyDate (জবাবের তারিখ), and a new
//   4th workflow stage's fields (investigationReportSummary,
//   recommendation, finalDecision). Field rename + additions, not purely
//   additive — see migrateSheets()'s note below.
//
//   V16.16 — disciplinaryactions REBUILT AGAIN (3rd round, per explicit
//   correction): notice1IssueDate renamed to showCauseDate (কারণ
//   দর্শানোর তারিখ); ৩টা নতুন MANUAL notice-print date field added
//   (notice1Date/notice2Date/notice3Date — no longer auto-filled from
//   the record's own `date`, per explicit request); evaluationDate added
//   for the renamed ৫ম ধাপ (মূল্যায়ন, was "Report and Recommendation").
//   NOTE: this version also added two FRONTEND-ONLY FactoryConfig fields
//   (referenceCode, festivalHolidays) for সূত্র নং generation and
//   business-day date math — these are NOT part of this backend schema;
//   factory config lives in src/factories/*.ts files, not a Sheet.
//
//   V16.17 — new module: onboarding (Onboarding Checklist — Part C of
//   Recruitment & Onboarding, the final piece; Part A lives inside
//   requisitions, Part B is the candidates module). One record = one
//   new joiner, with a FIXED 7-item checklist (document verification,
//   ID card, bank account, induction, department intro, equipment/
//   uniform, policy acknowledgment) — each item stored as its own JSON
//   column (completed/completedDate/notes), not a dynamic array, since
//   the checklist itself is standard across every joiner. New ID
//   prefix: ONB- (onboarding).
//
//   V16.18 — new modules: wagesgrid (Wages Grid — official government-
//   gazetted grade wage table, তফসিল-ক শ্রমিক / তফসিল-খ করণিক; one
//   record = one grade definition; compliance-checking against actual
//   employee wages is computed live at report time, not stored, same
//   principle as Living Wage's Wage Gap Report) and performance
//   (Employee Performance — one record = one review, with a
//   DYNAMICALLY-SIZED KPI array in kpiItemsJson, unlike onboarding's
//   fixed checklist since KPI count genuinely varies per employee/role/
//   cycle). New ID prefixes: WG- (wages grid), PRF- (performance).
//
//   V16.19 — new module: emergencylog (Emergency Log) — ONE module, TWO
//   log types via a dropdown (logType field): 'Injury and Accident Log'
//   (workplace injury/accident register, matching typical BSCI/Sedex/
//   WRAP EHS audit register requirements) and 'Grievance Log' (a
//   SIMPLE, separate register-style entry — confirmed deliberately NOT
//   connected to the existing full Grievance module's own workflow).
//   Both types share one flat field set, same "all fields present
//   regardless of active type" pattern as Requisition/Miscellaneous
//   Bill. New ID prefix: EL- (emergency log).
//
//   V16.20 — new modules: trainers (Trainer Master List — a reusable
//   trainer roster, per explicit confirmation a separate sub-module
//   rather than a plain text field on each training record; referenced
//   from trainingsessions' trainerName by name, a loose text reference
//   not a structured foreign key) and trainingsessions (Training
//   Module — one record = one training session, topics sourced from
//   Worker Guideline's actual 32-topic list, with a DYNAMICALLY-SIZED
//   participant array in participantsJson since attendee count
//   genuinely varies per session). New ID prefixes: TRN- (trainer),
//   TRS- (training session).
//
//   V16.21 — new modules: riskassessment (Risk Assessment — a standard
//   hazard/risk register, columns match a reference image exactly:
//   সেকশন/উৎস/ঝুঁকি সনাক্তকরণ/প্রভাব/প্রতিকার/ঝুঁকির কারণ অনুসন্ধান/
//   ঝুঁকির মাত্রা/সংশোধনমূলক-প্রতিষেধক কার্য/দায়িত্বপ্রাপ্ত ব্যক্তি; one
//   flat record per risk entry) and complianceaudit (Compliance Audit —
//   a standard BSCI/Sedex/SMETA-style Corrective Action Plan audit
//   report, also matching a reference image exactly; ONE module, TWO
//   types via auditType: 'Internal' | 'External for Supplier'; THREE
//   dynamically-sized arrays — auditingAreasJson, auditorsJson,
//   correctiveActionsJson). New ID prefixes: RA- (risk assessment),
//   CA- (compliance audit).
//
// AFTER UPGRADING FROM AN OLDER VERSION:
//   Run migrateSheets() once in the Apps Script editor. This creates the
//   3 new/changed module tabs (auditvisits, legaldocuments, miscbills)
//   and adds any missing columns to existing sheets. Never deletes
//   columns or data — if you previously ran V16.8, the old
//   auditVisitsJson/legalDocumentsJson columns will simply sit unused;
//   safe to remove later via rebuildModule() once confident no data was
//   saved under V16.8 (if any was, it needs manual migration since the
//   shape genuinely changed from array to flat record).
//
// ═══════════════════════════════════════════════════════════════════════════════

const SHEET_COLUMNS = {

  // ── Final Settlement ────────────────────────────────────────────────────────
  settlements: [
    'id','savedAt','savedBy','factoryId',
    'employeeName','cardNo','designation','section',
    'joiningDate','lastAttendance','settlementDate','terminationType',
    'serviceYears','serviceMonths','serviceDays','benefitYears',
    'totalDays','absentDays',
    'totalWage','basicWage','houseRent',
    'foodAllowance','medicalAllowance','transportAllowance',
    'dailyBasic','dailyGross',
    'elQty','noticePayDay','noticeDeductionDay',
    'payableDay','payableHours','lastMonthName','lastMonthYear',
    'earnedLeave','serviceCompensation','deathCompensation','noticePay',
    'lastMonthSalary','lastMonthOvertime','others',
    'serviceCompDaysPerYear','DeathCompensationDaysPerYear',
    'advanceDeduction','noticeDeduction','otherDeduction','totalDeductions',
    'totalReceivable','finalTotal',
  ],

  // ── Maternity Benefit ───────────────────────────────────────────────────────
  // V16.7: REDESIGN — removed the 12 flat installment1*/installment2*
  // columns plus benefitInstallment/activeInstallment entirely (per
  // explicit confirmation that existing data doesn't need to carry
  // forward). installmentsJson (added in V16.6) is now the ONLY
  // installment-related column — same JSON-blob pattern as
  // requisitions.itemsJson / increments.employeesJson.
  maternity: [
    'id','savedAt','savedBy','factoryId',
    'employeeName','cardNo','designation','department','aliveChildren',
    'joiningDate','maternityLeavenoticedDate','maternitySymptomDate',
    'deliveryDate','leaveStartDate','leaveEndDate',
    'serviceYears','serviceMonths','serviceDays','eligibilityStatus',
    'monthlyWage','dailyGross',
    'benifitDays','benefitAmount',
    'billDate',
    'latestMonth','latestYear',
    'totalPayable','formDate',
    'activeInstallmentType',
    'installmentsJson',
  ],

  // ── Left Employee Notice ────────────────────────────────────────────────────
  // houseNo is stored inside addressesJson — no separate column needed
  leftnotice: [
    'id','savedAt','savedBy','factoryId',
    'employeeName','cardNo','designation','department',
    'fatherName','motherName','gender','husbandName','date','joiningDate',
    'absentFrom','absentTo','totalAbsentDays',
    'firstNoticeDate','secondNoticeDate','thirdNoticeDate',
    'noticeType','notes','addressesJson',
  ],

  // ── Employee Personal File ──────────────────────────────────────────────────
  // V16.5: Added onnano, presentHouseNo, permanentHouseNo, grossSalary, drivingLicense
  employees: [
    'id','savedAt','savedBy','factoryId','date',
    // Personal info
    'fullName','fullNameBengali','fatherName','motherName',
    'dateOfBirth','gender','bloodGroup','maritalStatus',
    'nationality','religion',
    'height','weight','identificationMark',
    'nid','birthRegistrationNo','passportNumber',
    'drivingLicense',                              // NEW V16.5
    'tinNumber',
    // Contact
    'mobile','email','onnano',                     // NEW V16.5: onnano
    // Present address
    'presentHouseNo',                              // NEW V16.5
    'presentUnion','presentVillage','presentPostOffice',
    'presentThana','presentDistrict','presentDivision',
    'presentAddress',
    // Permanent address
    'permanentHouseNo',                            // NEW V16.5
    'permanentUnion','permanentVillage','permanentPostOffice',
    'permanentThana','permanentDistrict','permanentDivision',
    'permanentAddress',
    // Employment
    'idNo','cardNo','proximityNumber','grade',
    'otCategory','wagesSchedule',                  // NEW: OT Category, Wages Schedule (তফসিল-ক/খ)
    'sectionLine',
    'designation','department',
    'joiningDate',
    'grossSalary',                                 // NEW V16.5: মাসিক বেতন (মোট)
    'attendanceBonus',                              // হাজিরা বোনাস (হাজিরা বোনাস ৭২৫ টাকা)
    'fixedSalary',
    'basicSalary','houseRent',
    'medicalAllowance','transportAllowance','foodAllowance',
    'jobSource','localRepresentative',             // localRepresentative kept for compat
    'bankName','bankAccountNo','bankBranch',
    // Family
    'spouseName','spouseBloodGroup','spousePhone',
    'spouseProfession','spouseDob','spouseEducation',
    'numberOfSons','numberOfDaughters',
    // Arrays (JSON)
    'educationHistoryJson','previousJobsJson',
    // Emergency
    'emergencyName','emergencyRelation',
    'emergencyMobile','emergencyProfession',
    // Nominee
    'nomineeName','nomineeRelation','nomineeNid','nomineeAddress',
    'nomineePercentage','nomineeProfession',
    'nomineeUnion','nomineeVillage','nomineePostOffice',
    'nomineeThana','nomineeDistrict','nomineeDob',
    'nomineePhone','nomineeEducation','nomineeBloodGroup',
    // Supervisor / সুপারিশকারী
    'supervisorName','supervisorOrg','supervisorProfession',
    'supervisorDesignation','supervisorAddress',
    'supervisorRelation','supervisorPhone',
    // Company / print
    'companyName','companyAddress','employeeId','greeting',
  ],

  // ── Requisition ─────────────────────────────────────────────────────────────
  requisitions: [
    'id','savedAt','savedBy','factoryId',
    'subject','date','preparedBy','preparedByDesignation',
    'itemsJson','totalItems','quantityType','totalAmount',
    'status',
  ],

  // ── Increment Bill ──────────────────────────────────────────────────────────
  increments: [
    'id','savedAt','savedBy','factoryId',
    'subject','date','preparedBy','preparedByDesignation',
    'employeeName','cardNo','designation','department',
    'oldBasic','oldTotal','newBasic','newTotal',
    'incrementAmount','effectiveDate','reason',
    'employeesJson','totalEmployees',
  ],

  // ── Meeting Minutes ─────────────────────────────────────────────────────────
  meetings: [
    'id','savedAt','savedBy','factoryId',
    'organizationName','organizationAddress','department',
    'meetingTitle','meetingEstablishDate','meetingType','meetingNumber',
    'noticeDate','meetingDate','startTime','endTime','venue',
    'virtualMeetingLink','meetingImage',
    'chairperson','secretary','attendeesJson',
    'previousMinutesReference','previousMinutesApproval','previousMinutesRejectionDetails',
    'agendaJson',
    'generalNotes','closingNotes','annexuresJson',
    'nextMeetingDate','nextMeetingTime','nextMeetingVenue',
    'authorizationJson','distributionJson',
    'photosJson',
  ],

  // ── Audit/Visit/Certification Validity Record ──────────────────────────────
  // V16.10: field set changed to match the explicit column spec (Record ID
  // maps to the existing 'id' column; "Actions" is a UI-only concept, not
  // a stored field).
  auditvisits: [
    'id','savedAt','savedBy','factoryId',
    'auditCertification','standardBuyer','auditorOrganization','visitDate',
    'validityPeriodValue','validityPeriodUnit','reportCertificate',
    'preparedBy','preparedByDesignation',
  ],

  // ── Legal Document Validity Status ──────────────────────────────────────────
  // REDESIGN: one record = one document (flat fields), NOT an array-of-items
  // document — matches Left Employee Notice's save model.
  // ── Legal Document/License/Certificate/Agreement Record ─────────────────────
  // V16.10: field set changed to match the explicit column spec (Document ID
  // maps to the existing 'id' column; "Actions" is a UI-only concept, not
  // a stored field).
  legaldocuments: [
    'id','savedAt','savedBy','factoryId',
    'documentTitle','category','documentNo','issuingAuthority',
    'issueDate','expiryDate','attachment',
    'preparedBy','preparedByDesignation',
  ],

  // ── Miscellaneous Bill ───────────────────────────────────────────────────────
  // Requisition-style: one document = subject + date + array of line items,
  // 3 templates (holiday/adjustment/festival) sharing the same itemsJson
  // shape — see MiscBillManager.tsx.
  miscbills: [
    'id','savedAt','savedBy','factoryId',
    'template','subject','date','preparedBy','preparedByDesignation',
    'itemsJson','totalItems','totalAmount',
  ],

  // ── Living Wage (Anker Methodology) ─────────────────────────────────────────
  // One record = one living-wage study/entry (benchmark OR calculator mode).
  // Wage-gap comparison itself pulls live from the employees sheet at
  // report time — not stored here.
  livingwage: [
    'id','savedAt','savedBy','factoryId',
    'method','location','studyYear','sourceReference','benchmarkAmount',
    'foodCost','housingCost','healthcareCost','educationCost','transportCost',
    'clothingCost','communicationCost','otherEssentialCost',
    'contingencyMarginPercent','familySize','workersPerFamily','payrollDeductionPercent',
    'surveysJson','totalSurveys',
    'managementReviewJson','correctiveActionsJson','commitmentJson',
    'date','preparedBy','preparedByDesignation',
  ],

  // ── Supplier Assessment, Approval & Tracking ────────────────────────────────
  // One record = one supplier, with an array of assessment entries (one per
  // standard — BSCI/Sedex SMETA/WRAP/Other, one supplier can be assessed
  // against multiple standards). Approval decision is stored PER assessment
  // inside assessmentsJson, not as a separate top-level field.
  suppliers: [
    'id','savedAt','savedBy','factoryId',
    'supplierName','address','contactPerson','phone','email',
    'businessType','productCategory','tradeLicenseNo',
    'assessmentsJson','totalAssessments',
    'date','preparedBy','preparedByDesignation',
  ],

  // ── Disciplinary Action ──────────────────────────────────────────────────────
  // Branching workflow (Show Cause -> reply status -> if unsatisfactory,
  // investigation committee -> notice to start investigation). Committee
  // member details are a DYNAMICALLY-SIZED array (row count driven by
  // numberOfCommitteeMembers, not manually added/removed), stored in
  // committeeMembersJson.
  // ── Disciplinary Action ──────────────────────────────────────────────────────
  // REBUILT (2nd round, per explicit request + 3 reference letter images):
  // notice1Date renamed to notice1IssueDate; added referenceNo, subject,
  // complaint, replyDate, investigationReportSummary, recommendation,
  // finalDecision (the new Report and Recommendation step).
  // ── Disciplinary Action ──────────────────────────────────────────────────────
  // REBUILT AGAIN (3rd round, per explicit correction): notice1IssueDate
  // renamed to showCauseDate (কারণ দর্শানোর তারিখ); 3 new MANUAL notice-
  // date fields added (notice1Date/notice2Date/notice3Date — no longer
  // auto-filled from the record's own `date`); evaluationDate added for
  // the renamed ৫ম ধাপ (মূল্যায়ন).
  disciplinaryactions: [
    'id','savedAt','savedBy','factoryId',
    'referenceNo','employeeName','cardNo','designation','section','joiningDate',
    'showCauseDate','subject','complaint',
    'replyDate','replyStatus',
    'numberOfCommitteeMembers','notice2Date',
    'committeeMembersJson','notice3Date',
    'investigationReportSummary','recommendation','finalDecision','evaluationDate',
    'date','preparedBy','preparedByDesignation',
  ],

  // ── Candidate Pipeline ────────────────────────────────────────────────────────
  // Part B of Recruitment & Onboarding (Employee Lifecycle & Growth
  // Management). One record = one candidate, tracked through a single
  // CURRENT stage (not a full stage-transition history log — same
  // complexity level as Legal Document's Status / Supplier Assessment's
  // Approval Status).
  candidates: [
    'id','savedAt','savedBy','factoryId',
    'candidateName','phone','email','positionAppliedFor','department',
    'requisitionReference','applicationDate','source','stage',
    'interviewDate','interviewFeedback','expectedSalary','offeredSalary','joiningDate',
    'remarks','date','preparedBy','preparedByDesignation',
  ],

  // ── Onboarding Checklist ──────────────────────────────────────────────────────
  // Part C of Recruitment & Onboarding (Employee Lifecycle & Growth
  // Management) — final piece: Part A (Manpower Requisition) lives
  // inside requisitions, Part B (Candidate Pipeline) tracks candidates
  // through to "Joined", this tracks the actual onboarding process for
  // each new joiner. One record = one employee, with a FIXED 7-item
  // checklist (each item stored as its own JSON column — completed/
  // completedDate/notes — not a dynamic array, since the checklist
  // itself is standard across every new joiner).
  onboarding: [
    'id','savedAt','savedBy','factoryId',
    'employeeName','cardNo','designation','department','joiningDate',
    'candidateReference','mentorName',
    'probationStartDate','probationEndDate','probationStatus',
    'documentVerificationJson','idCardIssuedJson','bankAccountSetupJson',
    'inductionTrainingJson','departmentIntroductionJson','equipmentUniformIssuedJson',
    'policyAcknowledgmentJson',
    'remarks','date','preparedBy','preparedByDesignation',
  ],

  // ── Wages Grid ────────────────────────────────────────────────────────────────
  // Official government-gazetted grade wage structure (তফসিল-ক শ্রমিক /
  // তফসিল-খ করণিক). One record = one grade definition. Used by
  // GradeComplianceReport (frontend) to check actual employee
  // grossSalary (from the employees sheet) against each employee's
  // assigned grade's minimum — no separate compliance-result storage
  // here, computed live at report time, same principle as Living Wage's
  // Wage Gap Report.
  wagesgrid: [
    'id','savedAt','savedBy','factoryId',
    'gradeName','scheduleType','basicWage','houseRentAllowance',
    'medicalAllowance','conveyanceAllowance','foodAllowance',
    'effectiveDate','gazetteReference','remarks',
    'date','preparedBy','preparedByDesignation',
  ],

  // ── Employee Performance ─────────────────────────────────────────────────────
  // One record = one performance review, with a DYNAMICALLY-SIZED KPI
  // array (kpiItemsJson) — unlike Onboarding's fixed 7-item checklist,
  // KPI count genuinely varies per employee/role/cycle.
  performance: [
    'id','savedAt','savedBy','factoryId',
    'employeeName','cardNo','designation','department',
    'reviewCycle','reviewPeriodStart','reviewPeriodEnd',
    'kpiItemsJson',
    'selfAssessment','supervisorAssessment','ratingCategory','overallScoreOverride',
    'reviewerName','reviewerDesignation','reviewDate',
    'recommendedIncrementPercent','comments',
    'date','preparedBy','preparedByDesignation',
  ],

  // ── Emergency Log ─────────────────────────────────────────────────────────────
  // ONE module, TWO log types via a dropdown (logType) — same pattern as
  // Requisition/Miscellaneous Bill's multi-type templates. 'Injury and
  // Accident Log' and 'Grievance Log' (a simple register, deliberately
  // separate from the full Grievance module's own workflow) share this
  // one flat field set — column names match EmergencyLogManager.tsx's
  // buildRecord() exactly (timeOfIncident/locationOfIncident/
  // typeOfInjury, not incidentTime/location/injuryType).
  emergencylog: [
    'id','savedAt','savedBy','factoryId',
    'logType','employeeName','cardNo','designation','department','date','remarks',
    'timeOfIncident','locationOfIncident','typeOfInjury','severity',
    'incidentDescription','immediateActionTaken',
    'firstAidGiven','medicalTreatmentRequired','hospitalReferred','hospitalName',
    'witnessNames','reportedBy','investigationStatus','correctiveAction','daysLost',
    'natureOfGrievance','grievanceCategory','actionTaken','resolutionStatus','resolutionDate',
    'preparedBy','preparedByDesignation',
  ],

  // ── Trainer Master List ──────────────────────────────────────────────────────
  // A reusable list of trainers (per explicit confirmation — a separate
  // sub-module, not a plain text field on each training record).
  // Referenced from trainingsessions' trainerName field by name (loose
  // text reference, not a structured foreign key — matches this app's
  // established pattern for cross-module references elsewhere, e.g.
  // Candidate Pipeline's requisitionReference).
  trainers: [
    'id','savedAt','savedBy','factoryId',
    'trainerName','trainerType','designation','specialization','organization',
    'contactNumber','email','remarks',
    'date','preparedBy','preparedByDesignation',
  ],

  // ── Training Module ───────────────────────────────────────────────────────────
  // Training topics sourced from Worker Guideline's 32-topic list (per
  // explicit request). One record = one training session, with a
  // DYNAMICALLY-SIZED participant array (participantsJson) — count
  // genuinely varies per session, same pattern as committee members/KPI
  // items.
  trainingsessions: [
    'id','savedAt','savedBy','factoryId',
    'trainingTopic','customTopic','trainingMonth','trainingYear',
    'noticeIssueDate','noticeDetails',
    'trainerName',
    'scheduledDate','scheduledTime','venue','duration',
    'status','conductedDate',
    'pictureLink',
    'participantsJson',
    'remarks','date','preparedBy','preparedByDesignation',
  ],

  // ── Risk Assessment ───────────────────────────────────────────────────────────
  // Standard hazard/risk register, columns match the reference image
  // exactly (সেকশন/উৎস/ঝুঁকি সনাক্তকরণ/প্রভাব/প্রতিকার/ঝুঁকির কারণ
  // অনুসন্ধান/ঝুঁকির মাত্রা/সংশোধনমূলক-প্রতিষেধক কার্য/দায়িত্বপ্রাপ্ত
  // ব্যক্তি). One record = one risk entry (flat register, not a
  // multi-item form — matches how the reference image itself lists each
  // hazard source as its own row, even within the same section).
  riskassessment: [
    'id','savedAt','savedBy','factoryId',
    'section','source','riskIdentification','impact','remedy','causeInvestigation',
    'riskLevel','correctiveAction','correctiveActionDate',
    'responsiblePersonName','responsiblePersonDesignation',
    'remarks','date','preparedBy','preparedByDesignation',
  ],

  // ── Compliance Audit ──────────────────────────────────────────────────────────
  // Standard BSCI/Sedex/SMETA-style Corrective Action Plan (CAP) audit
  // report, matching the reference image's exact structure. ONE module,
  // TWO audit types via auditType ('Internal' | 'External for
  // Supplier'). auditingAreasJson/auditorsJson/correctiveActionsJson are
  // all DYNAMICALLY-SIZED arrays — auditing areas is a multi-select
  // (0-7 of the standard 7 areas), auditors and non-compliance items
  // both genuinely vary in count per audit.
  complianceaudit: [
    'id','savedAt','savedBy','factoryId',
    'auditType',
    'companyName','siteName','siteAddress',
    'siteContactName','siteContactJobTitle','sitePhone','siteEmail',
    'auditRound','auditingAreasJson','auditDate','auditorsJson',
    'correctiveActionsJson',
    'remarks','date','preparedBy','preparedByDesignation',
  ],

};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getProps() {
  var p = PropertiesService.getScriptProperties();
  return {
    secretKey:  p.getProperty('SECRET_KEY'),
    sheetId:    p.getProperty('SHEET_ID'),
    factoryIds: (p.getProperty('FACTORY_IDS') || '')
                  .split(',').map(function(s) { return s.trim(); }).filter(Boolean),
  };
}

function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function generateId(module, factoryId) {
  var prefix = {
    settlements: 'FS', maternity: 'MB', leftnotice: 'LN',
    employees: 'EP', requisitions: 'RQ', increments: 'INC', meetings: 'MTG',
    auditvisits: 'AV', legaldocuments: 'LD', miscbills: 'MSC', livingwage: 'LW', suppliers: 'SUP', disciplinaryactions: 'DA', candidates: 'CAN', onboarding: 'ONB', wagesgrid: 'WG', performance: 'PRF', emergencylog: 'EL', trainers: 'TRN', trainingsessions: 'TRS', riskassessment: 'RA', complianceaudit: 'CA',
  }[module] || 'REC';
  var factory = (factoryId || 'GEN').toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 4);
  return prefix + '-' + factory + '-' + new Date().getTime().toString(36).toUpperCase();
}

function styleHeader(sheet, numCols) {
  var r = sheet.getRange(1, 1, 1, numCols);
  r.setBackground('#1e3a5f');
  r.setFontColor('#ffffff');
  r.setFontWeight('bold');
  r.setFontSize(11);
  sheet.setFrozenRows(1);
  for (var i = 1; i <= numCols; i++) sheet.setColumnWidth(i, 140);
}

function getSheet(spreadsheet, module) {
  var sheet = spreadsheet.getSheetByName(module);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(module);
    var cols = SHEET_COLUMNS[module] || ['id','savedAt','savedBy','factoryId'];
    sheet.getRange(1, 1, 1, cols.length).setValues([cols]);
    styleHeader(sheet, cols.length);
    Logger.log('Auto-created sheet: ' + module + ' in ' + spreadsheet.getName());
  }
  return sheet;
}

function getHeaders(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) return [];
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0];
}

function getAllFactoryIds() {
  var props = getProps();
  var ids   = props.factoryIds.slice();
  if (props.sheetId && ids.indexOf(props.sheetId) === -1) ids.unshift(props.sheetId);
  return ids.filter(Boolean);
}

function formatCellValue(val) {
  if (val === null || val === undefined || val === '') return '';
  if (val instanceof Date) {
    var y  = val.getFullYear();
    var mo = String(val.getMonth() + 1).padStart(2, '0');
    var d  = String(val.getDate()).padStart(2, '0');
    var hh = String(val.getHours()).padStart(2, '0');
    var mm = String(val.getMinutes()).padStart(2, '0');
    // Google Sheets stores time-only values as 1899-12-30 + fractional day.
    // Detect by local date — return HH:MM so <input type="time"> works.
    if (y === 1899 && val.getMonth() === 11 && val.getDate() === 30) {
      return hh + ':' + mm;
    }
    return y + '-' + mo + '-' + d;
  }
  if (typeof val === 'object') return JSON.stringify(val);
  // Strip leading apostrophe used to force plain text storage of time values
  var s = String(val);
  if (s.charAt(0) === "'") return s.substring(1);
  return s;
}

// ── Action Handlers ───────────────────────────────────────────────────────────

function handleSave(body, spreadsheet) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var module    = body.module;
    var factoryId = body.factoryId;
    var savedBy   = body.savedBy;
    var record    = body.record;

    if (!module || !SHEET_COLUMNS[module]) {
      return respond({ ok: false, error: 'Unknown module: ' + module });
    }

    var sheet   = getSheet(spreadsheet, module);
    var headers = getHeaders(sheet);
    var id      = generateId(module, factoryId);
    var savedAt = new Date().toISOString();

    var rowObj = Object.assign(
      { id: id, savedAt: savedAt, savedBy: savedBy || '', factoryId: factoryId || '' },
      record
    );

    var row = headers.map(function(h) {
      var val = rowObj[h];
      if (val === undefined || val === null) return '';
      // Force time fields as plain text string to prevent Sheets auto-converting
      // "09:30" → Date object (which then reads back as wrong time due to timezone)
      if ((h === 'startTime' || h === 'endTime' || h === 'nextMeetingTime') && val !== '') {
        return "'" + String(val);
      }
      return formatCellValue(val);
    });

    var newRow = sheet.getLastRow() + 1;
    sheet.appendRow(row);
    // Force text format on time columns to prevent future auto-conversion
    var timeColNames = ['startTime', 'endTime', 'nextMeetingTime'];
    timeColNames.forEach(function(colName) {
      var colIdx = headers.indexOf(colName);
      if (colIdx >= 0) {
        sheet.getRange(newRow, colIdx + 1).setNumberFormat('@STRING@');
      }
    });
    return respond({ ok: true, id: id, savedAt: savedAt });

  } finally {
    lock.releaseLock();
  }
}

function handleLoad(params, spreadsheet) {
  var module    = params.module;
  var factoryId = params.factoryId;
  var limit     = params.limit;

  if (!module || !SHEET_COLUMNS[module]) {
    return respond({ ok: false, error: 'Unknown module: ' + module });
  }

  var sheet   = getSheet(spreadsheet, module);
  var headers = getHeaders(sheet);
  var lastRow = sheet.getLastRow();

  if (lastRow <= 1) return respond({ ok: true, records: [] });

  var data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();

  var records = data.map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = formatCellValue(row[i]); });
    return obj;
  }).filter(function(r) { return r.id; });

  if (factoryId && factoryId !== 'all') {
    records = records.filter(function(r) { return r.factoryId === factoryId; });
  }

  records.sort(function(a, b) {
    return new Date(b.savedAt || 0) - new Date(a.savedAt || 0);
  });

  var max = parseInt(limit) || 50;
  records = records.slice(0, max);

  return respond({ ok: true, records: records, count: records.length });
}

function handleUpdate(body, spreadsheet) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var module    = body.module;
    var id        = body.id;
    var record    = body.record;
    var factoryId = body.factoryId;
    var savedBy   = body.savedBy;

    if (!module || !id || !record) {
      return respond({ ok: false, error: 'module, id and record are required' });
    }

    var sheet   = getSheet(spreadsheet, module);
    var headers = getHeaders(sheet);
    var idIndex = headers.indexOf('id');

    if (idIndex === -1) return respond({ ok: false, error: 'id column not found in sheet' });

    var data     = sheet.getDataRange().getValues();
    var rowIndex = -1;
    for (var i = 1; i < data.length; i++) {
      if (data[i][idIndex] === id) { rowIndex = i; break; }
    }

    if (rowIndex === -1) return respond({ ok: false, error: 'Record not found: ' + id });

    var existing = {};
    headers.forEach(function(h, i) { existing[h] = formatCellValue(data[rowIndex][i]); });

    var merged = Object.assign({}, existing, record, {
      id:        id,
      savedAt:   new Date().toISOString(),
      savedBy:   savedBy   || existing.savedBy   || '',
      factoryId: factoryId || existing.factoryId || '',
    });

    var newRow = headers.map(function(h) {
      var val = merged[h];
      if (val === undefined || val === null) return '';
      if ((h === 'startTime' || h === 'endTime' || h === 'nextMeetingTime') && val !== '') {
        return "'" + String(val);
      }
      return formatCellValue(val);
    });

    sheet.getRange(rowIndex + 1, 1, 1, headers.length).setValues([newRow]);
    // Force text format on time columns
    var timeColNames = ['startTime', 'endTime', 'nextMeetingTime'];
    timeColNames.forEach(function(colName) {
      var colIdx = headers.indexOf(colName);
      if (colIdx >= 0) {
        sheet.getRange(rowIndex + 1, colIdx + 1).setNumberFormat('@STRING@');
      }
    });
    return respond({ ok: true, id: id, savedAt: merged.savedAt });

  } finally {
    lock.releaseLock();
  }
}

function handleDelete(body, spreadsheet) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var module = body.module;
    var id     = body.id;

    if (!module || !id) return respond({ ok: false, error: 'module and id required' });

    var sheet   = getSheet(spreadsheet, module);
    var headers = getHeaders(sheet);
    var idIndex = headers.indexOf('id');

    var data     = sheet.getDataRange().getValues();
    var rowIndex = -1;
    for (var i = 1; i < data.length; i++) {
      if (data[i][idIndex] === id) { rowIndex = i; break; }
    }

    if (rowIndex === -1) return respond({ ok: false, error: 'Record not found: ' + id });

    sheet.deleteRow(rowIndex + 1);
    return respond({ ok: true, deleted: id });

  } finally {
    lock.releaseLock();
  }
}

function handleStats(params, spreadsheet) {
  var factoryId = params.factoryId;
  var stats     = {};

  Object.keys(SHEET_COLUMNS).forEach(function(module) {
    var sheet = spreadsheet.getSheetByName(module);
    if (!sheet) { stats[module] = 0; return; }

    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var rows    = data.slice(1).filter(function(r) { return r[0]; });

    if (factoryId && factoryId !== 'all') {
      var fidx = headers.indexOf('factoryId');
      rows = rows.filter(function(r) { return r[fidx] === factoryId; });
    }

    stats[module] = rows.length;
  });

  return respond({ ok: true, stats: stats });
}

// ── Entry Points ──────────────────────────────────────────────────────────────

function doPost(e) {
  try {
    var props = getProps();
    var body  = JSON.parse(e.postData.contents);

    if (!props.secretKey || body.key !== props.secretKey) {
      return respond({ ok: false, error: 'Unauthorized' });
    }
    if (!body.spreadsheetId) return respond({ ok: false, error: 'spreadsheetId required' });

    var ss = SpreadsheetApp.openById(body.spreadsheetId);

    switch (body.action) {
      case 'save':   return handleSave(body, ss);
      case 'update': return handleUpdate(body, ss);
      case 'delete': return handleDelete(body, ss);
      default:       return respond({ ok: false, error: 'Unknown action: ' + body.action });
    }
  } catch(err) {
    return respond({ ok: false, error: err.message });
  }
}

function doGet(e) {
  try {
    var props = getProps();
    var p     = e.parameter;

    if (!props.secretKey || p.key !== props.secretKey) {
      return respond({ ok: false, error: 'Unauthorized' });
    }

    if (p.action === 'ping') {
      return respond({ ok: true, message: 'RMS backend online v16.21', ts: new Date().toISOString() });
    }

    if (!p.spreadsheetId) return respond({ ok: false, error: 'spreadsheetId required' });

    var ss = SpreadsheetApp.openById(p.spreadsheetId);

    switch (p.action) {
      case 'load':  return handleLoad(p, ss);
      case 'stats': return handleStats(p, ss);
      default:      return respond({ ok: false, error: 'Unknown action: ' + p.action });
    }
  } catch(err) {
    return respond({ ok: false, error: err.message });
  }
}

// ── Setup & Migration Tools ───────────────────────────────────────────────────

/**
 * setupAllFactories()
 * Run once after adding a new factory ID to FACTORY_IDS Script Property.
 * Creates all module tabs in every factory spreadsheet.
 * Safe to re-run — skips tabs that already exist.
 */
function setupAllFactories() {
  var ids = getAllFactoryIds();
  if (ids.length === 0) {
    Logger.log('ERROR: No factory IDs found. Set SHEET_ID and/or FACTORY_IDS in Script Properties.');
    return;
  }
  ids.forEach(function(ssId) {
    try {
      var ss = SpreadsheetApp.openById(ssId);
      Logger.log('Setting up: ' + ss.getName() + ' (' + ssId + ')');
      Object.keys(SHEET_COLUMNS).forEach(function(module) { getSheet(ss, module); });
      Logger.log('  Done: ' + Object.keys(SHEET_COLUMNS).length + ' modules ready');
    } catch(err) {
      Logger.log('  ERROR with ' + ssId + ': ' + err.message);
    }
  });
  Logger.log('setupAllFactories complete.');
}

/**
 * migrateSheets()
 * Run after updating SHEET_COLUMNS — adds new columns to existing sheets.
 * Never deletes existing columns or data. Safe to run multiple times.
 *
 * REQUIRED after upgrading to V16.21:
 *   Creates the new riskassessment and complianceaudit tabs. No other
 *   schema changes this version.
 */
function migrateSheets() {
  var ids = getAllFactoryIds();
  if (ids.length === 0) {
    Logger.log('ERROR: No factory IDs. Set SHEET_ID and/or FACTORY_IDS in Script Properties.');
    return;
  }

  ids.forEach(function(ssId) {
    try {
      var ss = SpreadsheetApp.openById(ssId);
      Logger.log('Migrating: ' + ss.getName());

      Object.keys(SHEET_COLUMNS).forEach(function(module) {
        var expectedCols = SHEET_COLUMNS[module];
        var sheet        = ss.getSheetByName(module);

        if (!sheet) {
          sheet = ss.insertSheet(module);
          sheet.getRange(1, 1, 1, expectedCols.length).setValues([expectedCols]);
          styleHeader(sheet, expectedCols.length);
          Logger.log('  Created: ' + module);
          return;
        }

        var lastCol      = sheet.getLastColumn();
        var existingCols = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
        var missing      = expectedCols.filter(function(c) { return existingCols.indexOf(c) === -1; });

        if (missing.length === 0) {
          Logger.log('  ' + module + ': up to date ✓');
          return;
        }

        missing.forEach(function(col) {
          var newColIndex = sheet.getLastColumn() + 1;
          var cell = sheet.getRange(1, newColIndex);
          cell.setValue(col);
          cell.setBackground('#1e3a5f').setFontColor('#fff').setFontWeight('bold').setFontSize(11);
          sheet.setColumnWidth(newColIndex, 140);
          Logger.log('  ' + module + ': added "' + col + '" at col ' + newColIndex);
        });
      });

    } catch(err) {
      Logger.log('  ERROR with ' + ssId + ': ' + err.message);
    }
  });

  Logger.log('migrateSheets complete.');
}

/**
 * rebuildModule(module)
 * Rebuilds a specific module tab in all factories.
 * Preserves all existing data, fixes column order/header issues.
 * Call from editor: rebuildModule('employees')
 */
function rebuildModule(module) {
  if (!module || !SHEET_COLUMNS[module]) {
    Logger.log('ERROR: Unknown module "' + module + '". Available: ' + Object.keys(SHEET_COLUMNS).join(', '));
    return;
  }

  var ids      = getAllFactoryIds();
  var expected = SHEET_COLUMNS[module];

  ids.forEach(function(ssId) {
    try {
      var ss    = SpreadsheetApp.openById(ssId);
      var sheet = ss.getSheetByName(module);
      Logger.log('Rebuilding ' + module + ' in ' + ss.getName());

      if (!sheet) {
        sheet = ss.insertSheet(module);
        sheet.getRange(1, 1, 1, expected.length).setValues([expected]);
        styleHeader(sheet, expected.length);
        Logger.log('  Created fresh sheet');
        return;
      }

      var data    = sheet.getDataRange().getValues();
      var headers = data[0];
      var rows    = data.slice(1);

      var rebuilt = rows.map(function(row) {
        var obj = {};
        headers.forEach(function(h, i) { obj[h] = row[i]; });
        return expected.map(function(c) {
          var v = obj[c];
          return (v !== undefined && v !== null) ? v : '';
        });
      }).filter(function(row) { return row[0]; });

      sheet.clear();
      sheet.getRange(1, 1, 1, expected.length).setValues([expected]);
      if (rebuilt.length > 0) {
        sheet.getRange(2, 1, rebuilt.length, expected.length).setValues(rebuilt);
      }
      styleHeader(sheet, expected.length);
      Logger.log('  Rebuilt: ' + rebuilt.length + ' rows, ' + expected.length + ' columns');

    } catch(err) {
      Logger.log('  ERROR with ' + ssId + ': ' + err.message);
    }
  });

  Logger.log('rebuildModule("' + module + '") complete.');
}

/**
 * rebuildAll()
 * Rebuilds all modules across all factories.
 */
function rebuildAll() {
  Object.keys(SHEET_COLUMNS).forEach(function(module) { rebuildModule(module); });
}

/**
 * verifySetup()
 * Diagnostic — logs column status for every module in every factory.
 * Run this to spot mismatches quickly.
 */
function verifySetup() {
  var ids = getAllFactoryIds();
  if (ids.length === 0) { Logger.log('ERROR: No factory IDs configured.'); return; }

  Logger.log('=== RMS V16.21 Setup Verification ===');

  ids.forEach(function(ssId) {
    try {
      var ss = SpreadsheetApp.openById(ssId);
      Logger.log('\nFactory: ' + ss.getName() + ' (' + ssId + ')');

      Object.keys(SHEET_COLUMNS).forEach(function(module) {
        var expected = SHEET_COLUMNS[module];
        var sheet    = ss.getSheetByName(module);

        if (!sheet) { Logger.log('  [MISSING] ' + module); return; }

        var lastCol  = sheet.getLastColumn();
        var existing = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
        var missing  = expected.filter(function(c) { return existing.indexOf(c) === -1; });
        var extra    = existing.filter(function(c) { return expected.indexOf(c) === -1; });
        var rows     = Math.max(0, sheet.getLastRow() - 1);

        if (missing.length === 0 && extra.length === 0) {
          Logger.log('  [OK] ' + module + ' — ' + rows + ' records, ' + existing.length + ' cols ✓');
        } else {
          Logger.log('  [WARN] ' + module + ' — ' + rows + ' records');
          if (missing.length > 0) Logger.log('    Missing: ' + missing.join(', '));
          if (extra.length > 0)   Logger.log('    Extra:   ' + extra.join(', '));
        }
      });

    } catch(err) {
      Logger.log('  ERROR opening ' + ssId + ': ' + err.message);
    }
  });

  Logger.log('\n=== Done. Run migrateSheets() to fix any [WARN] items. ===');
}