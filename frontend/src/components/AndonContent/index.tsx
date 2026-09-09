import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import './andoncontent.css';

export interface AndonItem {
    partNumber: string;
    descricao: string;
    status: string;
    responsavel: string;
}

const AndonContent = () => {
    const [andonData, setAndonData] = useState<AndonItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Busca os dados diretamente da API no Backend
                const response = await api.get<AndonItem[]>('/andon');
                setAndonData(response.data);
            } catch (error) {
                console.error('Erro ao buscar dados do Andon:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <section className="andon-container">
            <h1 className="page-title">Andon</h1>

            <div className="andon-card">
                <div className="table-wrapper">
                    <table className="andon-table">
                        <thead>
                            <tr>
                                <th>
                                    <div className="th-content">
                                        <span>PART NUMBER</span>
                                        <button className="filter-btn" title="Filtrar">▼</button>
                                    </div>
                                </th>
                                <th>
                                    <div className="th-content">
                                        <span>DESCRIÇÃO</span>
                                        <button className="filter-btn" title="Filtrar">▼</button>
                                    </div>
                                </th>
                                <th>
                                    <div className="th-content">
                                        <span>STATUS</span>
                                        <button className="filter-btn" title="Filtrar">▼</button>
                                    </div>
                                </th>
                                <th>
                                    <div className="th-content">
                                        <span>RESPONSÁVEL</span>
                                        <button className="filter-btn" title="Filtrar">▼</button>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="state-td">Carregando...</td>
                                </tr>
                            ) : andonData.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="state-td">Nenhum registro no Andon</td>
                                </tr>
                            ) : (
                                andonData.map((item, index) => (
                                    <tr key={index}>
                                        <td className="font-bold">{item.partNumber}</td>
                                        <td>{item.descricao}</td>
                                        <td>{item.status}</td>
                                        <td>{item.responsavel}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
};

export default AndonContent;