import './sidebar.css'

function Sidebar() {
    return (
        <div className='sidebar'>
            <div className='body'>
                <div className='itens'>
                    <span className='sidebar-link'>Lista</span>
                    <span className='sidebar-link'>Andon</span>
                    <span className='sidebar-link'>Dashboard</span>
                </div>
            </div>
        </div>
    );
}

export default Sidebar