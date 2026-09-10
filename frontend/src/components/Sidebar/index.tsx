import './sidebar.css';

interface SidebarProps {
    isOpen: boolean;
    onToggle: () => void;
    activeMenu: string;
    onSelectMenu: (menu: string) => void;
}

const Sidebar = ({ isOpen, onToggle, activeMenu, onSelectMenu }: SidebarProps) => {
    const menuItems = [
        { id: 'lista', label: 'Lista' },
        { id: 'andon', label: 'Andon' },
        { id: 'dashboard', label: 'Dashboard' },
    ];

    return (
        <aside className={`sidebar ${isOpen ? 'open' : 'collapsed'}`}>
            <div className='sidebar-header'>
                <button className='toggle-button' onClick={onToggle} aria-label='Alternar Menu'>
                    <span className='hamburger-icon'>
                        <span></span>
                        <span></span>
                        <span></span>
                    </span>
                </button>
            </div>

            <nav className='sidebar-nav'>
                {menuItems.map((item) => (
                    <button key={item.id} className={`sidebar-link ${activeMenu === item.id ? 'active' : ''}`} onClick={() => onSelectMenu(item.id)}>
                        <span className='link-text'>{item.label}</span>
                    </button>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;