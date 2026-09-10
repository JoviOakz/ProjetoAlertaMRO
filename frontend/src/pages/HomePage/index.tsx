import { useState } from 'react';
import './homepage.css';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import ListContent from '@/components/ListContent';
import AndonContent from '@/components/AndonContent';
import DashboardContent from '@/components/DashboardContent';

const Home = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [activeMenu, setActiveMenu] = useState('lista');

    const toggleSidebar = () => {
        setIsSidebarOpen((prev) => !prev);
    };

    return (
        <div className='layout-container'>
            <Header />

            <div className='layout-body'>
                <Sidebar
                    isOpen={isSidebarOpen}
                    onToggle={toggleSidebar}
                    activeMenu={activeMenu}
                    onSelectMenu={setActiveMenu}
                />

                <main className='main-content'>
                    {activeMenu === 'lista' && <ListContent />}
                    {activeMenu === 'andon' && <AndonContent />}
                    {activeMenu === 'dashboard' && <DashboardContent />}
                </main>
            </div>
        </div>
    );
};

export default Home;