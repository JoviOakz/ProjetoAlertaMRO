import './header.css';
import logo from '@/assets/bosch_logo.svg';
import colorLine from '@/assets/color_line.png';

const Header = () => {
    return (
        <header className='header-container'>
            <img className='color-line' src={colorLine} alt='' aria-hidden='true' />
            <div className='header-content'>
                <div className='header-left'>
                    <img className='header-logo' src={logo} alt='Logo Bosch' />
                </div>
                <h2>Painel de Trabalho - MRO CtP</h2>
                <button className='header-user-button'>User Icon</button>
            </div>
        </header>
    );
};

export default Header;