import './TabSelector.css';

interface Tab<T = string> {
  id: T;
  label: string;
  labelKey?: string;
  icon: string;
}

interface TabSelectorProps<T = string> {
  tabs: Tab<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
}

export function TabSelector<T extends string = string>({
  tabs,
  activeTab,
  onTabChange,
}: TabSelectorProps<T>) {
  return (
    <div className="tab-selector" role="tablist">
      {tabs.map(tab => (
        <button
          key={String(tab.id)}
          className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
          aria-label={`Switch to ${tab.label} tab`}
          aria-selected={activeTab === tab.id}
          role="tab"
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
