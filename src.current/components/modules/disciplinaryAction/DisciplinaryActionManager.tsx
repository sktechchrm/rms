// ─────────────────────────────────────────────────────────────────────────────
// DisciplinaryActionManager.tsx
// Path: src/components/modules/disciplinaryAction/DisciplinaryActionManager.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';
import { useFactory } from '../../../hooks/useFactory';
import { useAuth } from '../../../context/AuthContext';
import { useDatabase } from '../../../hooks/useDatabase';
import { DEFAULT_AUTHORIZATION } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import ModuleShell from '../../shell/ModuleShell';
import DisciplinaryActionForm from './DisciplinaryActionForm';
import NoticePrintView from './NoticePrintView';
import { exportToPDF } from '../../../utils/pdfExport';
import { toDateInput } from '../../../utils/dateUtils';
import { BASE_PRINT_CSS, PAGE_A4_PORTRAIT } from '../../../utils/printCSS';
import type { DisciplinaryActionData, ReplyStatus, CommitteeMember } from './types';
import { blankDisciplinaryActionData } from './types';

const STEPS = [
  { id: 'form', label: 'শৃঙ্খলামূলক ব্যবস্থা', icon: 'ti-gavel', fieldCount: 4 },
];

function recordToFormData(rec: Record<string, unknown>, prev: DisciplinaryActionData): DisciplinaryActionData {
  return {
    ...prev,
    employeeName:  String(rec.employeeName ?? ''),
    cardNo:        String(rec.cardNo ?? ''),
    designation:   String(rec.designation ?? ''),
    section:       String(rec.section ?? ''),
    joiningDate:   toDateInput(rec.joiningDate) || '',
    notice1Date:   toDateInput(rec.notice1Date) || prev.notice1Date,
    replyStatus:   (rec.replyStatus === 'Satisfactory' || rec.replyStatus === 'Not Satisfactory' ? rec.replyStatus : '') as ReplyStatus,
    numberOfCommitteeMembers: String(rec.numberOfCommitteeMembers ?? ''),
    committeeMembers: (() => {
      try {
        const parsed = JSON.parse(String(rec.committeeMembersJson ?? '[]'));
        if (!Array.isArray(parsed)) return prev.committeeMembers;
        return parsed.map((m, i): CommitteeMember => ({
          slNo:        Number(m.slNo ?? i + 1),
          name:        String(m.name ?? ''),
          cardNo:      String(m.cardNo ?? ''),
          designation: String(m.designation ?? ''),
          section:     String(m.section ?? ''),
        }));
      } catch { return prev.committeeMembers; }
    })(),
    date: toDateInput(rec.date) || prev.date,
  };
}

export default function DisciplinaryActionManager() {
  const factory  = useFactory();
  const { user } = useAuth();

  const sheets       = useDatabase('disciplinaryactions', factory.id, user?.name ?? 'unknown');
  const printAreaRef = useRef<HTMLDivElement>(null);

  const [authorization, setAuthorization] = useState<AuthorizationState>(DEFAULT_AUTHORIZATION);
  const [activeStep,    setActiveStep]    = useState<'form' | 'print'>('form');
  const [data,          setData]          = useState<DisciplinaryActionData>(blankDisciplinaryActionData());
  const [printingNotice, setPrintingNotice] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    setData(prev => ({ ...prev, factoryName: factory.nameEn, factoryAddress: factory.addressEn }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factory.id]);

  const handleReset = () => {
    setData(prev => ({ ...blankDisciplinaryActionData(), factoryName: prev.factoryName, factoryAddress: prev.factoryAddress }));
    setActiveStep('form');
    sheets.setEditingId(null);
  };

  const handlePrint = () => {
    const el = printAreaRef.current ?? document.getElementById('printable-area') as HTMLElement;
    if (!el) { window.print(); return; }
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;border:none;';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument!;
    const styles = Array.from(document.styleSheets)
      .map(ss => { try { return Array.from(ss.cssRules).map(r => r.cssText).join('\n'); } catch { return ''; } })
      .join('\n');
    doc.open();
    // Black-box print fix (see other modules for the fuller explanation):
    // forces html/body to plain white/black, placed AFTER the copied
    // stylesheets so it wins the cascade.
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
      <style>@page{size:A4 portrait;margin:12mm;}body{margin:0;}${styles}</style>
      <style>html,body{background:#fff !important;color:#000 !important;}</style>
      </head><body>${el.outerHTML}</body></html>`);
    doc.close();
    iframe.onload = () => {
      iframe.contentWindow!.focus();
      iframe.contentWindow!.print();
      iframe.contentWindow!.addEventListener('afterprint', () => { document.body.removeChild(iframe); });
    };
  };

  const handleExportPDF = async () => {
    const el = printAreaRef.current ?? document.getElementById('printable-area') as HTMLElement;
    if (!el) return;
    await exportToPDF({ element: el, filename: `DisciplinaryAction_Notice${printingNotice}_${data.employeeName.replace(/[^a-z0-9]/gi, '_') || 'Record'}`, scale: 2 });
  };

  const buildRecord = () => ({
    employeeName:              data.employeeName,
    cardNo:                    data.cardNo,
    designation:               data.designation,
    section:                   data.section,
    joiningDate:               data.joiningDate,
    notice1Date:               data.notice1Date,
    replyStatus:               data.replyStatus,
    numberOfCommitteeMembers:  data.numberOfCommitteeMembers,
    committeeMembersJson:      JSON.stringify(data.committeeMembers),
    date:                      data.date,
    preparedBy:                authorization.preparedBy,
    preparedByDesignation:     authorization.preparedByDesignation,
  });

  const handleGenerateNotice = (notice: 1 | 2 | 3) => {
    setPrintingNotice(notice);
    setActiveStep('print');
  };

  const billItems = [
    { label: 'সংরক্ষণ ছাড়াই প্রিন্ট', onClick: () => setActiveStep('print') },
  ];

  return (
    <>
      <style>{`
        ${BASE_PRINT_CSS}
        ${PAGE_A4_PORTRAIT}
      `}</style>

      <ModuleShell
        moduleName="শৃঙ্খলামূলক ব্যবস্থা"
        moduleNameEn="Disciplinary Action"
        date={data.date}
        onDateChange={d => setData(p => ({ ...p, date: d }))}

        steps={STEPS}
        activeStep={activeStep === 'form' ? 'form' : ''}
        onStepChange={id => setActiveStep(id as 'form')}

        billItems={billItems}
        isBillActive={activeStep === 'print'}

        onSave={async () => {
          const record = buildRecord();
          const ok = sheets.editingId
            ? await sheets.update(sheets.editingId, record)
            : await sheets.save(record);
          if (ok) handleReset();
          return ok;
        }}
        isSaving={sheets.isSaving}
        configured={sheets.configured}
        adapterName={sheets.adapterName}
        saveDisabled={!data.employeeName || !data.cardNo}

        editingId={sheets.editingId}
        onCancelEdit={handleReset}
        onReset={handleReset}

        onUpdate={rec => {
          sheets.setEditingId(String(rec.id ?? ''));
          setData(p => recordToFormData(rec, p));
          setActiveStep('form');
        }}
        updateModule="disciplinaryactions"
        updateLabel="শৃঙ্খলামূলক ব্যবস্থা খুঁজুন"
        updateSearchPlaceholder="কর্মীর নাম বা আইডি দিয়ে খুঁজুন..."

        calcRows={[
          { label: 'কর্মী',      value: data.employeeName || '—' },
          { label: 'জবাবের অবস্থা', value: data.replyStatus || '—' },
          { label: 'কমিটি সদস্য',  value: data.replyStatus === 'Not Satisfactory' ? `${data.numberOfCommitteeMembers || 0} জন` : '—' },
        ]}

        records={sheets.records}
        isLoading={sheets.isLoading}
        onLoadRecord={rec => {
          sheets.setEditingId(String(rec.id ?? ''));
          setData(p => recordToFormData(rec as Record<string, unknown>, p));
          setActiveStep('form');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onDeleteRecord={sheets.remove}
        onReload={sheets.reload}

        auth={authorization}
        onAuthChange={setAuthorization}
        onPrint={handlePrint}
        onPDF={handleExportPDF}
        lang="bn"
      >
        {activeStep === 'form' && (
          <DisciplinaryActionForm data={data} setData={setData} onGenerateNotice={handleGenerateNotice} />
        )}

        {activeStep === 'print' && (
          <div id="printable-area" ref={printAreaRef}>
            <NoticePrintView data={data} notice={printingNotice} authorization={authorization} />
          </div>
        )}
      </ModuleShell>
    </>
  );
}
