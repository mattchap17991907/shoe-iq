const TABS = [
  { id: 'browse',    label: 'Browse shoes' },
  { id: 'scan',      label: 'Start from a scan' },
  { id: 'insert',    label: 'Insert finder' },
  { id: 'checklist', label: 'Consultation checklist' },
  { id: 'add',       label: '+ Add new shoe' },
  { id: 'manage',    label: 'Manage rules' },
];

export default function Nav({ activeTab, onTabClick }) {
  return (
    <nav className="tab-bar">
      {TABS.map(t => (
        <button
          key={t.id}
          className={`tab${activeTab === t.id ? ' active' : ''}`}
          onClick={() => onTabClick(t.id)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
