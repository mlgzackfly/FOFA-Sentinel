import './TabSelector.css';

interface Tab {
  id: string;
  label: string;
  icon: string;
}

interface TabSelectorProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function TabSelector({ tabs, activeTab, onTabChange }: TabSelectorProps) {
  return (
    <div className="tab-selector">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

