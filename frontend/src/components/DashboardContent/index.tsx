import { useEffect, useState } from 'react';
import './dashboardcontent.css';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

// Registra os componentes necessários do Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const DashboardContent = () => {
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        // Simula carregamento do banco de dados
        const timer = setTimeout(() => setLoading(false), 300);
        return () => clearTimeout(timer);
    }, []);

    // 1. Dados para o gráfico de barras (QTD alertas por mês)
    const barData = {
        labels: ['JAN', 'FEV', 'MAR', 'ABR', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'],
        datasets: [
            {
                data: [78, 60, 45, 30, 40, 33, 45, 55, 46, 68, 66],
                backgroundColor: '#4C84FF',
                borderRadius: 8,
            },
        ],
    };

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: false },
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 80,
                grid: { color: '#f0f0f0' },
            },
            x: {
                grid: { display: false },
            },
        },
    };

    // 2. Dados para o primeiro gráfico de Pizza (Status alertas)
    const pieStatusData = {
        labels: ['SEM TRATATIVA', 'EM ANDAMENTO', 'CONCLUÍDO'],
        datasets: [
            {
                data: [15.8, 26.3, 57.9],
                backgroundColor: ['#FF5B5C', '#FFD043', '#6FD953'],
                borderWidth: 1,
            },
        ],
    };

    // 3. Dados para o segundo gráfico de Pizza (QTD alertas por tipo)
    const pieTypeData = {
        labels: ['HIBE', 'FHMI', 'MAZE'],
        datasets: [
            {
                data: [15.8, 26.3, 57.9],
                backgroundColor: ['#00429D', '#73A5FF', '#C2DCFF'],
                borderWidth: 1,
            },
        ],
    };

    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    font: { size: 11 },
                },
            },
        },
    };

    return (
        <section className="dashboard-container">
            <h1 className="page-title">Dashboard</h1>

            <div className="dashboard-card">
                {loading ? (
                    <div className="loading-container">Carregando indicadores...</div>
                ) : (
                    <div className="dashboard-grid">
                        {/* Gráfico Superior: Barras */}
                        <div className="chart-box full-width">
                            <h2 className="chart-title">QTD alertas disparados por mês</h2>
                            <div className="chart-wrapper bar-height">
                                <Bar data={barData} options={barOptions} />
                            </div>
                        </div>

                        {/* Gráficos Inferiores: Pizzas */}
                        <div className="chart-box">
                            <h2 className="chart-title">Status alertas</h2>
                            <div className="chart-wrapper pie-height">
                                <Pie data={pieStatusData} options={pieOptions} />
                            </div>
                        </div>

                        <div className="chart-box">
                            <h2 className="chart-title">QTD alertas por tipo de material</h2>
                            <div className="chart-wrapper pie-height">
                                <Pie data={pieTypeData} options={pieOptions} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default DashboardContent;