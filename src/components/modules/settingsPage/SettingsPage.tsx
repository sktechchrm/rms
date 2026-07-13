// ─────────────────────────────────────────────────────────────────────────────
// SettingsPage.tsx — simple placeholder page, per explicit request
// ("সরল, শুধু প্লেসহোল্ডার"). Reached from Dashboard's sidebar "Settings"
// item (bottom of the sidebar, below the 3 category accordion labels).
// Path: src/components/modules/settingsPage/SettingsPage.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { FaCog, FaUserCircle, FaBuilding, FaBell, FaShieldAlt } from 'react-icons/fa';

const font = "'Noto Sans Bengali', Arial, sans-serif";

const PLACEHOLDER_SECTIONS = [
  { icon: FaUserCircle, title: 'প্রোফাইল', titleEn: 'Profile', desc: 'ব্যক্তিগত তথ্য ও পাসওয়ার্ড পরিবর্তন' },
  { icon: FaBuilding,   title: 'ফ্যাক্টরি তথ্য', titleEn: 'Factory Info', desc: 'কোম্পানির নাম, ঠিকানা, লোগো' },
  { icon: FaBell,       title: 'নোটিফিকেশন', titleEn: 'Notifications', desc: 'সতর্কতা ও অনুস্মারক পছন্দ' },
  { icon: FaShieldAlt,  title: 'অনুমতি', titleEn: 'Permissions', desc: 'ব্যবহারকারী ভূমিকা ও মডিউল অ্যাক্সেস' },
];

export default function SettingsPage() {
  return (
    <div style={{ fontFamily: font, padding: '28px 20px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, background: '#eff6ff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e3a5f', fontSize: 20,
        }}>
          <FaCog />
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1e3a5f' }}>সেটিংস</div>
          <div style={{ fontSize: 12.5, color: '#94a3b8' }}>Settings</div>
        </div>
      </div>

      <div style={{
        padding: '12px 16px', background: '#eff6ff', border: '1px solid #bfdbfe',
        borderRadius: 8, fontSize: 12.5, color: '#1e40af', marginBottom: 24, lineHeight: 1.6,
      }}>
        এই পাতাটি এখনো তৈরি হচ্ছে — নিচের অংশগুলো শীঘ্রই সক্রিয় করা হবে।
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
        {PLACEHOLDER_SECTIONS.map(({ icon: Icon, title, titleEn, desc }) => (
          <div key={titleEn} style={{
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
            padding: '18px 16px', opacity: 0.7, cursor: 'not-allowed',
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, background: '#f1f5f9',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 16, marginBottom: 10,
            }}>
              <Icon />
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1e293b' }}>{title}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>{titleEn}</div>
            <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
