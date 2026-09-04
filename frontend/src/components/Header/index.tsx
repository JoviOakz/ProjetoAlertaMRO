import './header.css'
import logo from '@/assets/bosch_logo.svg'
import color_line from '@/assets/color_line.png'

const Header = () => {
    return (
        <div className='container'>
            <img className='color_line' src={color_line} />
            <div className='column'>
                <img className='logo' src={logo} alt='logo' />
                <button className='header-button'>User Icon</button>
            </div>
        </div>
    );
}

export default Header